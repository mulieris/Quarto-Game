import { useTranslation } from "react-i18next";
import type { BotDifficulty } from "@/logic/botEngine";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const botDifficulty = useSettingsStore((s) => s.botDifficulty);
  const setBotDifficulty = useSettingsStore((s) => s.setBotDifficulty);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-panel" role="dialog" aria-modal="true">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">{t("settings.title")}</h2>
          <button type="button" className="text-muted hover:text-ink" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="space-y-5 text-sm">
          <label className="flex flex-col gap-2">
            <span className="font-medium text-stone-700">{t("settings.language")}</span>
            <LanguageSwitcher />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white/80 px-3 py-2">
            <span className="font-medium text-stone-700">{t("settings.sound")}</span>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => {
                setSoundEnabled(e.target.checked);
                useGameStore.getState().setSoundEnabled(e.target.checked);
              }}
              className="h-4 w-4 accent-accent"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-medium text-stone-700">{t("settings.bot_difficulty")}</span>
            <select
              className="rounded-lg border border-stone-300 bg-white px-3 py-2"
              value={botDifficulty}
              onChange={(e) => {
                const v = e.target.value as BotDifficulty;
                setBotDifficulty(v);
                useGameStore.getState().setBotDifficulty(v);
              }}
            >
              <option value="easy">{t("settings.easy")}</option>
              <option value="medium">{t("settings.medium")}</option>
              <option value="hard">{t("settings.hard")}</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
