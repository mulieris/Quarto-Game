import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { RulesModal } from "@/components/RulesModal";
import { SettingsModal } from "@/components/SettingsModal";
import { useState } from "react";

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/hero-quarto.png)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/75" aria-hidden />
      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-amber-200/15 bg-stone-950/50 p-10 text-center shadow-2xl shadow-black/40 backdrop-blur-md">
          <h1 className="font-display text-4xl tracking-wide text-amber-100">{t("brand.title")}</h1>
          <p className="mt-2 text-sm text-amber-100/80">{t("brand.tagline")}</p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              className="rounded-2xl bg-amber-500/90 py-3 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-900/30 hover:bg-amber-400"
              onClick={() => navigate("/local")}
            >
              {t("menu.local")}
            </button>
            <button
              type="button"
              className="rounded-2xl border border-amber-200/25 bg-white/5 py-3 text-sm font-semibold text-amber-50 backdrop-blur-sm hover:bg-white/10"
              onClick={() => navigate("/bot")}
            >
              {t("menu.bot")}
            </button>
            <button
              type="button"
              className="rounded-2xl border border-amber-200/25 bg-white/5 py-3 text-sm font-semibold text-amber-50 backdrop-blur-sm hover:bg-white/10"
              onClick={() => navigate("/online")}
            >
              {t("menu.online")}
            </button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 border-t border-amber-200/15 pt-6">
            <button
              type="button"
              className="text-sm font-medium text-amber-200/90 hover:text-amber-100 hover:underline"
              onClick={() => setSettingsOpen(true)}
            >
              {t("menu.settings")}
            </button>
            <span className="text-amber-200/30">|</span>
            <button
              type="button"
              className="text-sm font-medium text-amber-200/90 hover:text-amber-100 hover:underline"
              onClick={() => setRulesOpen(true)}
            >
              {t("menu.rules")}
            </button>
            <span className="w-full text-left text-xs font-medium uppercase tracking-wide text-amber-200/60">
              {t("settings.language")}
            </span>
            <LanguageSwitcher variant="hero" className="w-full" />
          </div>
        </div>
      </div>
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
