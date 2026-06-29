import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Configuration Vite : plugin React + Tailwind v4 (via plugin officiel).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Force une instance unique de React et de l'ecosysteme three : evite les
    // erreurs "Invalid hook call" quand @react-three/postprocessing recoit une
    // copie distincte de React via le pre-bundling Vite.
    dedupe: ["react", "react-dom", "@react-three/fiber", "three"],
  },
  build: {
    // La couche 3D (three.js) est volumineuse mais deja isolee via import
    // paresseux. On releve le seuil d'alerte pour garder une sortie propre.
    chunkSizeWarningLimit: 1000,
  },
});
