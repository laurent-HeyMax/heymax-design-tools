import type { MainToUi, UiToMain } from '@shared/messages';

export function sendToMain(message: UiToMain) {
  parent.postMessage({ pluginMessage: message }, '*');
}

export function onFromMain(handler: (msg: MainToUi) => void) {
  const listener = (event: MessageEvent) => {
    const msg = (event.data as { pluginMessage?: MainToUi })?.pluginMessage;
    if (msg) handler(msg);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
