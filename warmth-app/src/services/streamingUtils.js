// Streaming utility for chat messages
// Streaming utility for chat messages
// Streaming utility for chat messages
export async function streamChatMessage(baseUrl, authToken, message, onToken, onComplete, onError) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${baseUrl}/chat/stream`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (authToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    }

    let seenBytes = 0;
    let buffer = '';

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        const newData = xhr.responseText.substring(seenBytes);
        seenBytes = xhr.responseText.length;

        if (newData) {
          buffer += newData;
          const parts = buffer.split('\n\n');
          
          // The last part might be incomplete, so keep it in the buffer
          // unless the request is done
          buffer = parts.pop(); 

          for (const part of parts) {
            const lines = part.split('\n');
            for (const line of lines) {
              if (line.trim().startsWith('data: ')) {
                const data = line.trim().slice(6);
                if (data === '[DONE]') {
                  if (onComplete) onComplete();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.token && onToken) {
                    onToken(parsed.token);
                  } else if (parsed.error && onError) {
                    onError(new Error(`Server Error: ${parsed.error}`));
                  }
                } catch (e) {
                  console.warn('JSON parse error:', e);
                }
              }
            }
          }
        }
      }

      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Process any remaining buffer if needed, though usually it ends with \n\n
          if (buffer.trim().startsWith('data: ')) {
             // Try to parse one last time just in case
             try {
                const data = buffer.trim().slice(6);
                if (data !== '[DONE]') {
                    const parsed = JSON.parse(data);
                    if (parsed.token && onToken) onToken(parsed.token);
                }
             } catch(e) {}
          }
          resolve();
        } else {
          let errorMsg = `HTTP Error ${xhr.status}`;
          if (xhr.responseText) {
            try {
              const errorJson = JSON.parse(xhr.responseText);
              if (errorJson.error) errorMsg += `: ${errorJson.error}`;
              else errorMsg += `: ${xhr.responseText.substring(0, 100)}`;
            } catch (e) {
              errorMsg += `: ${xhr.responseText.substring(0, 100)}`;
            }
          }
          const error = new Error(errorMsg);
          if (onError) onError(error);
          reject(error);
        }
      }
    };

    xhr.onerror = () => {
      const error = new Error('Network request failed. Check internet connection and API URL.');
      if (onError) onError(error);
      reject(error);
    };

    xhr.send(JSON.stringify({ message }));
  });
}
