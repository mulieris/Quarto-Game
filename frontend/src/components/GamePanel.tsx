import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PieceDefinition } from "@/logic/quartoTypes";
import { canUserActFromSnapshot, useGameStore } from "@/store/gameStore";
import { ConnectionStatusBar } from "@/components/ConnectionStatus";
import { PieceTray } from "@/components/PieceTray";

function pieceLabel(t: (k: string) => string, p: PieceDefinition) {
  return `${t(`piece.${p.color}`)}, ${t(`piece.${p.height}`)}, ${t(`piece.${p.shape}`)}, ${t(`piece.${p.top}`)}`;
}

export function GamePanel({
  onOpenRules,
  onOpenSettings,
  onCameraReset,
}: {
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onCameraReset: () => void;
}) {
  const { t } = useTranslation();
  const snap = useGameStore();
  const [toast, setToast] = useState<string | null>(null);
  const selectedPiece = useMemo(
    () => snap.pieces.find((p) => p.id === snap.selectedPieceId),
    [snap.pieces, snap.selectedPieceId],
  );

  const modeLabel =
    snap.mode === "local"
      ? t("panel.mode_local")
      : snap.mode === "bot"
        ? t("panel.mode_bot")
        : snap.mode === "online"
          ? t("panel.mode_online")
          : "—";

  const phaseLabel =
    snap.currentPhase === "select_piece" ? t("phase.choose_for_opponent") : t("phase.place_piece");

  const turnLabel = (() => {
    if (snap.mode === "bot") {
      if (snap.botThinking) return t("status.bot_thinking");
      if (snap.activePlayer === snap.humanPlayer) {
        if (snap.currentPhase === "select_piece") return t("turn.yours");
        return t("turn.yours");
      }
      return t("turn.bot");
    }
    if (snap.mode === "online" && snap.myPlayer !== null) {
      if (snap.activePlayer === snap.myPlayer) return t("turn.yours");
      return snap.activePlayer === 1 ? t("turn.player1") : t("turn.player2");
    }
    return snap.activePlayer === 1 ? t("turn.player1") : t("turn.player2");
  })();

  const resultBanner = (() => {
    if (snap.winner === null && !snap.draw) return null;
    if (snap.draw) return <div className="rounded-xl bg-stone-200 px-3 py-2 text-sm font-semibold">{t("result.draw")}</div>;
    if (snap.mode === "bot") {
      if (snap.winner === snap.humanPlayer)
        return <div className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-900">{t("result.win")}</div>;
      return <div className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-900">{t("result.lose")}</div>;
    }
    if (snap.mode === "online" && snap.myPlayer) {
      if (snap.winner === snap.myPlayer)
        return <div className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-900">{t("result.win")}</div>;
      return <div className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-900">{t("result.lose")}</div>;
    }
    return (
      <div className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950">
        {snap.winner === 1 ? t("turn.player1") : t("turn.player2")} — {t("result.win")}
      </div>
    );
  })();

  const canAct = canUserActFromSnapshot(snap);

  return (
    <aside className="flex w-full max-w-md shrink-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-stone-200/80 bg-white/70 p-4 shadow-panel backdrop-blur-md lg:max-h-full lg:max-w-sm">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
          onClick={onOpenRules}
        >
          {t("menu.rules")}
        </button>
        <button
          type="button"
          className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
          onClick={onOpenSettings}
        >
          {t("menu.settings")}
        </button>
        <button
          type="button"
          className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
          onClick={onCameraReset}
        >
          {t("actions.camera_reset")}
        </button>
      </div>

      {snap.mode === "online" ? (
        <ConnectionStatusBar
          status={snap.connectionStatus}
          opponentOnline={snap.opponentOnline}
          awaitingOpponent={snap.awaitingOpponent}
        />
      ) : null}

      {snap.mode === "online" && snap.roomId ? (
        <div className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white/80 p-3 text-xs">
          <div className="break-all text-stone-600">
            {typeof window !== "undefined" ? `${window.location.origin}/online/${snap.roomId}` : snap.roomId}
          </div>
          <button
            type="button"
            className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
            onClick={async () => {
              const url = `${window.location.origin}/online/${snap.roomId}`;
              try {
                await navigator.clipboard.writeText(url);
                setToast(t("toast.copied"));
                window.setTimeout(() => setToast(null), 2200);
              } catch {
                setToast(t("errors.error_unknown"));
                window.setTimeout(() => setToast(null), 2200);
              }
            }}
          >
            {t("lobby.copy_link")}
          </button>
          {toast ? <div className="text-emerald-800">{toast}</div> : null}
          <p className="text-[11px] text-muted">{t("lobby.start_hint")}</p>
        </div>
      ) : null}

      {resultBanner}

      <div className="grid gap-2 text-sm">
        <div className="flex justify-between gap-2 text-stone-600">
          <span>{t("panel.mode")}</span>
          <span className="font-medium text-ink">{modeLabel}</span>
        </div>
        <div className="flex justify-between gap-2 text-stone-600">
          <span>{t("panel.phase")}</span>
          <span className="text-right font-medium text-ink">{phaseLabel}</span>
        </div>
        <div className="flex justify-between gap-2 text-stone-600">
          <span>{t("panel.player")}</span>
          <span className="font-medium text-ink">{turnLabel}</span>
        </div>
        {snap.mode === "online" && snap.roomId ? (
          <div className="flex justify-between gap-2 text-stone-600">
            <span>{t("panel.room")}</span>
            <span className="font-mono text-xs font-medium text-ink">{snap.roomId}</span>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">{t("panel.selection")}</div>
        <div className="mt-1 text-sm text-ink">
          {selectedPiece ? pieceLabel(t, selectedPiece) : t("panel.none")}
        </div>
      </div>

      <PieceTray />

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">{t("history.title")}</div>
        <ol className="mt-2 max-h-40 list-decimal space-y-1 overflow-y-auto pl-4 text-xs text-stone-700">
          {snap.moveHistory.map((m) => (
            <li key={m.id}>
              {m.phase === "select_piece"
                ? `${m.player}: ${m.pieceId ?? ""}`
                : `${m.player}: (${m.cell?.row ?? "?"},${m.cell?.col ?? "?"})`}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        {(snap.winner !== null || snap.draw) && (
          <button
            type="button"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
            onClick={() => useGameStore.getState().requestRematch()}
          >
            {t("actions.rematch")}
          </button>
        )}
        <button
          type="button"
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          onClick={() => useGameStore.getState().resetToMenu()}
        >
          {t("lobby.back")}
        </button>
      </div>

      {snap.lastErrorKey ? (
        <div className="rounded-lg bg-rose-50 px-2 py-1 text-xs text-rose-800">
          {t(`errors.${snap.lastErrorKey}`, snap.lastErrorKey)}
        </div>
      ) : null}

      {!canAct && snap.mode === "bot" && snap.botThinking ? (
        <p className="text-xs text-muted">{t("status.bot_thinking")}</p>
      ) : null}
    </aside>
  );
}
