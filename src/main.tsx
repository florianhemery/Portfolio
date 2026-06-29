import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Polices variables auto-hebergees (fontsource) : titres/UI en Geist,
// petits labels en Geist Mono. Pas de requete reseau externe.
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
// Police Anton : utilisee pour dessiner le logo "{ EPITECH }" en particules.
import "@fontsource/anton";

import "./index.css";
import App from "./App.tsx";
import { LangProvider } from "./i18n/LangContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>
);
