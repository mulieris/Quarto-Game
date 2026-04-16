import { useEffect } from "react";
import { GameShell } from "@/app/GameShell";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";

export function BotGamePage() {
  useEffect(() => {
    const difficulty = useSettingsStore.getState().botDifficulty;
    useGameStore.getState().setBotDifficulty(difficulty);
    useGameStore.getState().startBot(1, difficulty);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <GameShell />
    </div>
  );
}
