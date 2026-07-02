import { useEffect } from "react";

// Palette d'accent par section : la teinte glisse au fil du scroll pour
// rythmer la page (le bleu Epitech reste la couleur d'ouverture / identite).
// Les MEMES teintes pilotent la nuee de particules (voir COLOR_RAMP dans
// three/ParticleField.tsx) : UI et fond restent accordes.
interface SectionAccent {
  accent: string;
  bright: string;
  dim: string;
  /* Triplet r, g, b pour composer les rgba() residuels */
  rgb: string;
}

const THEMES: Record<string, SectionAccent> = {
  hero: { accent: "#1f3cff", bright: "#5e79ff", dim: "#1730d0", rgb: "31, 60, 255" },
  about: { accent: "#6366f1", bright: "#818cf8", dim: "#4f46e5", rgb: "99, 102, 241" },
  skills: { accent: "#06b6d4", bright: "#22d3ee", dim: "#0891b2", rgb: "6, 182, 212" },
  timeline: { accent: "#3b82f6", bright: "#60a5fa", dim: "#2563eb", rgb: "59, 130, 246" },
  projects: { accent: "#8b5cf6", bright: "#a78bfa", dim: "#7c3aed", rgb: "139, 92, 246" },
  stats: { accent: "#8b5cf6", bright: "#a78bfa", dim: "#7c3aed", rgb: "139, 92, 246" },
  testimonials: { accent: "#8b5cf6", bright: "#a78bfa", dim: "#7c3aed", rgb: "139, 92, 246" },
  contact: { accent: "#d946ef", bright: "#e879f9", dim: "#c026d3", rgb: "217, 70, 239" },
};

/**
 * Observe la section visible et fait glisser la palette d'accent de l'UI.
 * Les variables etant enregistrees via @property (index.css), le changement
 * est anime en CSS : boutons, halos, liens et glow derivent en douceur.
 */
export function useSectionTheme(): void {
  useEffect(() => {
    const root = document.documentElement;
    const apply = (id: string) => {
      const t = THEMES[id];
      if (!t) return;
      root.style.setProperty("--color-accent", t.accent);
      root.style.setProperty("--color-accent-bright", t.bright);
      root.style.setProperty("--color-accent-dim", t.dim);
      root.style.setProperty("--color-accent-rgb", t.rgb);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) apply(entry.target.id);
        }
      },
      // La section qui traverse le centre du viewport donne sa teinte.
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    Object.keys(THEMES).forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
}
