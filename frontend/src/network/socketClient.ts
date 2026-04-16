export type ServerMessage =
  | { type: "state"; payload: Record<string, unknown> }
  | { type: "error"; code: string };

export function connectRoomSocket(
  roomId: string,
  playerSecret: string,
  handlers: {
    onOpen?: () => void;
    onClose?: () => void;
    onMessage: (msg: ServerMessage) => void;
  },
): WebSocket {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const url = `${proto}//${host}/ws/rooms/${encodeURIComponent(roomId)}?player_secret=${encodeURIComponent(playerSecret)}`;
  const ws = new WebSocket(url);
  ws.addEventListener("open", () => handlers.onOpen?.());
  ws.addEventListener("close", () => handlers.onClose?.());
  ws.addEventListener("message", (ev) => {
    try {
      const data = JSON.parse(String(ev.data)) as ServerMessage;
      handlers.onMessage(data);
    } catch {
      handlers.onMessage({ type: "error", code: "bad_payload" });
    }
  });
  return ws;
}

export function sendSocket(ws: WebSocket | null, payload: Record<string, unknown>) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}
