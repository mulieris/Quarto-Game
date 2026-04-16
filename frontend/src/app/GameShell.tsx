import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { GameCanvas } from "@/components/scene/GameCanvas";
import { GamePanel } from "@/components/GamePanel";
import { RulesModal } from "@/components/RulesModal";
import { SettingsModal } from "@/components/SettingsModal";
export function GameShell() {
  const { t } = useTranslation();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [camTick, setCamTick] = useState(0);

  const resetCamera = useCallback(() => setCamTick((n) => n + 1), []);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row lg:gap-6 lg:p-6">
      <div className="relative flex min-h-0 flex-1 flex-col">
        <header className="mb-3 shrink-0 lg:absolute lg:left-0 lg:right-0 lg:top-0 lg:z-10 lg:mb-0">
          <div>
            <h1 className="font-display text-2xl text-ink">{t("brand.title")}</h1>
            <p className="text-xs text-muted">{t("brand.tagline")}</p>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col lg:pt-14">
          <GameCanvas cameraReset={camTick} />
        </div>
      </div>
      <GamePanel
        onOpenRules={() => setRulesOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onCameraReset={resetCamera}
      />
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
