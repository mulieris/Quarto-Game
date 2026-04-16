import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import i18n from "./i18n";
import "./styles/index.css";
import { useGameStore } from "./store/gameStore";
import { useSettingsStore } from "./store/settingsStore";

const hydrateSettings = () => {
  const s = useSettingsStore.getState();
  void i18n.changeLanguage(s.language);
  useGameStore.setState({ soundEnabled: s.soundEnabled, botDifficulty: s.botDifficulty });
};

if (useSettingsStore.persist.hasHydrated()) {
  hydrateSettings();
} else {
  useSettingsStore.persist.onFinishHydration(hydrateSettings);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
