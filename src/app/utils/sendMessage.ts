export async function sendMessage<T = unknown>(
  type: string,
  payload?: unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const messageId = Math.random().toString(36).slice(2, 11);

    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error(`sendMessage timeout: ${type}`));
    }, 10_000);

    const handler = (event: MessageEvent) => {
      if (event.data?.messageId !== messageId) return;
      clearTimeout(timeout);
      window.removeEventListener('message', handler);
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.response as T);
    };

    window.addEventListener('message', handler);
    window.parent.postMessage({ type, payload, messageId }, '*');
  });
}