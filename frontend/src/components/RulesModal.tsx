import { useTranslation } from "react-i18next";

export function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-paper p-6 shadow-panel"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl text-ink">{t("rules.title")}</h2>
          <button
            type="button"
            className="rounded-full px-3 py-1 text-sm text-muted hover:bg-stone-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-stone-700">
          <p>{t("rules.intro")}</p>
          <p>{t("rules.turns")}</p>
          <p>{t("rules.win")}</p>
          <p>{t("rules.draw")}</p>
        </div>
      </div>
    </div>
  );
}
