import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BotDifficulty } from "@/logic/botEngine";

export type UILanguage =
  | "en"
  | "uk"
  | "ru"
  | "pl"
  | "zh"
  | "es"
  | "de"
  | "fr";

interface SettingsState {
  language: UILanguage;
  soundEnabled: boolean;
  botDifficulty: BotDifficulty;
  setLanguage: (lng: UILanguage) => void;
  setSoundEnabled: (v: boolean) => void;
  setBotDifficulty: (d: BotDifficulty) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: "en",
      soundEnabled: true,
      botDifficulty: "medium",
      setLanguage: (language) => set({ language }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setBotDifficulty: (botDifficulty) => set({ botDifficulty }),
    }),
    {
      name: "quarto-settings",
      partialize: (s) => ({
        language: s.language,
        soundEnabled: s.soundEnabled,
        botDifficulty: s.botDifficulty,
      }),
    },
  ),
);
