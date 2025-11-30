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

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        const newData = xhr.responseText.substring(seenBytes);
        seenBytes = xhr.responseText.length;

        if (newData) {
          const lines = newData.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
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
                // Ignore incomplete JSON chunks
              }
            }
          }
        }
      }

      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          let errorMsg = `HTTP Error ${xhr.status}`;
          if (xhr.responseText) {
            try {
              // Try to parse error from JSON response
              const errorJson = JSON.parse(xhr.responseText);
              if (errorJson.error) errorMsg += `: ${errorJson.error}`;
              else errorMsg += `: ${xhr.responseText.substring(0, 100)}`;
            } catch (e) {
              // If not JSON, just append text
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
