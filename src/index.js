import {
  KVStore
} from "fastly:kv-store";
import {
  Router
} from "@fastly/expressly";
import {
  getGeolocationForIpAddress
} from "fastly:geolocation"
import {
  streamToString
} from './utils';

const router = new Router();

router.get("/vanilla", async (req, res) => {
  res.send(await fetch("/", {
    backend: "origin_playground_antoinebrossault_com",
  }));
});


router.get("/vanilla-ttl-10h", async (req, res) => {
  res.send(await fetch("/", {
    backend: "origin_playground_antoinebrossault_com",
    ttl: 60*60*10 // TTL 10 hours
  }));
});


router.get("/", async (req, res) => {

  let adToServe = "base";

  if (req.ip) {

    const geoLocData = getGeolocationForIpAddress(req.ip)

    adToServe = geoLocData.city ? geoLocData.city.toLowerCase().split(' ').join('-') : "base";

  }

  const files = new KVStore('main');

  let entry = await files.get(adToServe);

  if(!entry) {
    entry =  await files.get("base");
  }

  // Forward the request to a backend.
  let beResp = await fetch(
    "https://origin-playground.antoinebrossault.com", {
      backend: "origin_playground_antoinebrossault_com",
      ttl: 60*60*10 // TTL 10 hours
    }
  );


  if (beResp.headers.get("Content-Type").startsWith('text/')) {

    let body = await beResp.text();

    let newBody = body.replace(`<div id="ad"></div>`, `<div id="ad">${await streamToString(entry.body)}</div>`);

    beResp = new Response(newBody, beResp);

  }

  res.send(beResp);

});



router.all("(.*)", async (req, res) => {
  res.send(await fetch(req, {
    backend: "origin_playground_antoinebrossault_com"
  }));
});

router.listen();