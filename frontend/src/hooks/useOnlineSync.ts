import { useEffect, useRef } from "react";
import { connectRoomSocket } from "@/network/socketClient";
import { setGameConnectionStatus, useGameStore } from "@/store/gameStore";

export function useOnlineSync(roomId: string | undefined) {
  const online = useGameStore((s) => s.online);
  const mode = useGameStore((s) => s.mode);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<number | null>(null);

  useEffect(() => {
    if (!roomId || mode !== "online" || !online) return undefined;

    let stopped = false;

    const cleanupWs = () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      useGameStore.getState().attachOnlineSocket(null);
    };

    const connect = () => {
      cleanupWs();
      if (stopped) return;
      setGameConnectionStatus("connecting");
      const ws = connectRoomSocket(roomId, online.playerSecret, {
        onOpen: () => {
          setGameConnectionStatus("connected");
        },
        onClose: () => {
          if (stopped) return;
          setGameConnectionStatus("reconnecting");
          retryRef.current = window.setTimeout(connect, 1600);
        },
        onMessage: (msg) => {
          if (msg.type === "state") {
            useGameStore.getState().applyServerPayload(msg.payload as Record<string, unknown>);
          } else if (msg.type === "error") {
            useGameStore.setState({ lastErrorKey: msg.code });
          }
        },
      });
      wsRef.current = ws;
      useGameStore.getState().attachOnlineSocket(ws);
    };

    connect();

    return () => {
      stopped = true;
      if (retryRef.current) window.clearTimeout(retryRef.current);
      cleanupWs();
      setGameConnectionStatus("idle");
    };
  }, [roomId, mode, online?.playerSecret]);
}
