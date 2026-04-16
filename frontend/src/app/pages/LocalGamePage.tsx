import { useEffect } from "react";
import { GameShell } from "@/app/GameShell";
import { useGameStore } from "@/store/gameStore";

export function LocalGamePage() {
  useEffect(() => {
    useGameStore.getState().startLocal();
  }, []);
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <GameShell />
    </div>
  );
}
