import { useTranslation } from "react-i18next";
import { supportedLngs } from "@/i18n";
import type { UILanguage } from "@/store/settingsStore";
import { useSettingsStore } from "@/store/settingsStore";

const labels: Record<UILanguage, string> = {
  en: "English",
  uk: "Українська",
  ru: "Русский",
  pl: "Polski",
  zh: "中文",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
};

export function LanguageSwitcher({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "hero";
}) {
  const { i18n } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const skin =
    variant === "hero"
      ? "border-amber-200/25 bg-stone-950/70 text-amber-50 ring-amber-400/40 focus:ring-2"
      : "border-stone-300 bg-white/90 text-ink ring-accent focus:ring-2";

  return (
    <select
      className={`rounded-lg border px-3 py-2 text-sm shadow-sm outline-none ${skin} ${className}`}
      value={language}
      onChange={(e) => {
        const lng = e.target.value as UILanguage;
        setLanguage(lng);
        void i18n.changeLanguage(lng);
      }}
    >
      {supportedLngs.map((lng) => (
        <option key={lng} value={lng}>
          {labels[lng]}
        </option>
      ))}
    </select>
  );
}
