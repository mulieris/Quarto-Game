import { useTranslation } from "react-i18next";
import type { ConnectionStatus } from "@/logic/quartoTypes";

const dot: Record<ConnectionStatus, string> = {
  idle: "bg-stone-400",
  connecting: "bg-amber-500 animate-pulse",
  connected: "bg-emerald-500",
  reconnecting: "bg-amber-500 animate-pulse",
  disconnected: "bg-rose-500",
  error: "bg-rose-600",
  room_full: "bg-rose-500",
};

export function ConnectionStatusBar({
  status,
  opponentOnline,
  awaitingOpponent,
}: {
  status: ConnectionStatus;
  opponentOnline: boolean;
  awaitingOpponent: boolean;
}) {
  const { t } = useTranslation();
  let message = t(`status.${status === "room_full" ? "room_full" : status}`);
  if (awaitingOpponent) message = t("lobby.waiting");
  else if (!opponentOnline && status === "connected") message = t("lobby.opponent_disconnected");
  else if (status === "reconnecting") message = t("lobby.reconnecting");

  return (
    <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-1.5 text-xs text-stone-700">
      <span className={`h-2 w-2 rounded-full ${dot[status] ?? dot.idle}`} />
      <span>{message}</span>
    </div>
  );
}
