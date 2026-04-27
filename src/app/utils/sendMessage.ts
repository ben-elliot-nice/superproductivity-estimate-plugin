export async function sendMessage<T = unknown>(
  type: string,
  payload?: unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const messageId = Math.random().toString(36).slice(2, 11);

    const timeout = setTimeout(() => {
      console.error(`[iframe→plugin] TIMEOUT: ${type} (id=${messageId})`);
      window.removeEventListener('message', handler);
      reject(new Error(`sendMessage timeout: ${type}`));
    }, 10_000);

    const handler = (event: MessageEvent) => {
      if (event.data?.messageId !== messageId) return;
      clearTimeout(timeout);
      window.removeEventListener('message', handler);
      if (event.data.error) {
        console.error(`[iframe←plugin] ERROR response for ${type}:`, event.data.error);
        reject(new Error(event.data.error));
      } else {
        console.log(`[iframe←plugin] response for ${type}:`, event.data.response);
        resolve(event.data.response as T);
      }
    };

    window.addEventListener('message', handler);
    console.log(`[iframe→plugin] sending:`, { type, payload, messageId });
    window.parent.postMessage({ type, payload, messageId }, '*');
  });
}