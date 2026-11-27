import { NET_EVENT } from './constants.js';

/** A WebSocket to this page's server. on(type, fn) hears server messages and NET_EVENT; close() is silent. */
export function connect(path) {
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${scheme}://${location.host}${path}`);
  const handlers = {};
  const emit = (type, msg) => (handlers[type] || []).forEach((fn) => fn(msg));

  ws.onopen = () => emit(NET_EVENT.OPEN);
  ws.onclose = () => emit(NET_EVENT.CLOSE);
  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    if (msg && typeof msg.type === 'string') emit(msg.type, msg);
  };

  return {
    send(type, payload = {}) {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, ...payload }));
    },
    on(type, fn) {
      (handlers[type] = handlers[type] || []).push(fn);
    },
    close() {
      ws.onclose = null;
      ws.close();
    },
  };
}
