import { useTranslation } from "react-i18next";
import { useGameStore } from "@/store/gameStore";

/** Accessible list of pieces still available to be chosen (complements the 3D tray). */
export function PieceTray() {
  const { t } = useTranslation();
  const board = useGameStore((s) => s.board);
  const pieces = useGameStore((s) => s.pieces);

  const unused = pieces
    .filter((p) => {
      if (p.used) return false;
      for (let r = 0; r < 4; r += 1) {
        for (let c = 0; c < 4; c += 1) {
          if (board[r][c] === p.id) return false;
        }
      }
      return true;
    })
    .sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <div className="rounded-xl border border-stone-200 bg-white/70 p-3 text-xs text-stone-700">
      <div className="font-semibold uppercase tracking-wide text-muted">{t("panel.selection")}</div>
      <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
        {unused.map((p) => (
          <li key={p.id} className="font-mono text-[11px]">
            #{p.id} — {t(`piece.${p.color}`)}, {t(`piece.${p.height}`)}, {t(`piece.${p.shape}`)}, {t(`piece.${p.top}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}
