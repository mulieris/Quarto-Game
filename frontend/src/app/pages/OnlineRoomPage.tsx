import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { GameShell } from "@/app/GameShell";
import { useOnlineSync } from "@/hooks/useOnlineSync";
import { onlineSessionKey } from "@/lib/storageKeys";
import { joinRoom } from "@/network/roomApi";
import { useGameStore } from "@/store/gameStore";

export function OnlineRoomPage() {
  const { roomId = "" } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [needJoin, setNeedJoin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(onlineSessionKey(roomId));
    if (!raw) {
      setNeedJoin(true);
      return;
    }
    try {
      const { secret, seat } = JSON.parse(raw) as { secret: string; seat: 1 | 2 };
      useGameStore.getState().seedOnlineLobby(roomId, secret, seat);
      setNeedJoin(false);
    } catch {
      setNeedJoin(true);
    }
  }, [roomId]);

  useOnlineSync(needJoin ? undefined : roomId);

  async function onJoinThisRoom() {
    setBusy(true);
    setErr(null);
    try {
      const res = await joinRoom(roomId);
      sessionStorage.setItem(onlineSessionKey(res.room_id), JSON.stringify({ secret: res.player_secret, seat: res.seat }));
      useGameStore.getState().seedOnlineLobby(res.room_id, res.player_secret, res.seat);
      setNeedJoin(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "error_unknown");
    } finally {
      setBusy(false);
    }
  }

  if (needJoin) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="max-w-md text-sm text-stone-700">{t("lobby.invite_hint")}</p>
        <p className="font-mono text-lg text-ink">{roomId}</p>
        <button
          type="button"
          disabled={busy}
          className="rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
          onClick={onJoinThisRoom}
        >
          {t("lobby.join")}
        </button>
        {err ? <p className="text-sm text-rose-700">{t(`errors.${err}`, err)}</p> : null}
        <button type="button" className="text-sm text-muted hover:text-ink" onClick={() => navigate("/online")}>
          {t("lobby.back")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <GameShell />
    </div>
  );
}
