export const streamToString = async (stream) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        result += decoder.decode(value, { stream: !done });
      }
    }
    
    return result;
  }
  