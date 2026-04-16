import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { onlineSessionKey } from "@/lib/storageKeys";
import { createRoom, joinRoom } from "@/network/roomApi";

export function LobbyPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate() {
    setBusy(true);
    setError(null);
    try {
      const res = await createRoom();
      sessionStorage.setItem(onlineSessionKey(res.room_id), JSON.stringify({ secret: res.player_secret, seat: res.seat }));
      navigate(`/online/${res.room_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error_unknown");
    } finally {
      setBusy(false);
    }
  }

  async function onJoin() {
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await joinRoom(trimmed);
      sessionStorage.setItem(onlineSessionKey(res.room_id), JSON.stringify({ secret: res.player_secret, seat: res.seat }));
      navigate(`/online/${res.room_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error_unknown");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 rounded-3xl border border-stone-200 bg-white/80 p-8 shadow-panel backdrop-blur">
      <h1 className="font-display text-3xl text-ink">{t("lobby.title")}</h1>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={busy}
          className="rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow hover:opacity-95 disabled:opacity-50"
          onClick={onCreate}
        >
          {t("lobby.create")}
        </button>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm"
            placeholder={t("lobby.room_code_placeholder")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-50 disabled:opacity-50"
            onClick={onJoin}
          >
            {t("lobby.join")}
          </button>
        </div>
      </div>
      {error ? <p className="text-sm text-rose-700">{t(`errors.${error}`, error)}</p> : null}
      <button type="button" className="text-sm text-muted hover:text-ink" onClick={() => navigate("/")}>
        {t("lobby.back")}
      </button>
    </div>
  );
}
