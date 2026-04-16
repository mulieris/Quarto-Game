import { Navigate, Route, Routes } from "react-router-dom";
import { BotGamePage } from "@/app/pages/BotGamePage";
import { HomePage } from "@/app/pages/HomePage";
import { LocalGamePage } from "@/app/pages/LocalGamePage";
import { OnlineLobbyPage } from "@/app/pages/OnlineLobbyPage";
import { OnlineRoomPage } from "@/app/pages/OnlineRoomPage";

export default function App() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/local" element={<LocalGamePage />} />
        <Route path="/bot" element={<BotGamePage />} />
        <Route path="/online" element={<OnlineLobbyPage />} />
        <Route path="/online/:roomId" element={<OnlineRoomPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
