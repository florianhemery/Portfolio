// Variants Motion reutilisables, centralises ici (regle du brief).
// Principes : on n'anime que `transform` et `opacity`, spring par defaut,
// durees courtes, jamais d'easing lineaire. Le respect de
// `useReducedMotion()` est gere au niveau des composants (props `initial`,
// fallback, transitions), ces variants restent volontairement sobres.

import type { Variants, Transition } from "motion/react";

// Spring de reference : reactif mais doux, sans rebond excessif.
export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 0.9,
};

// Spring plus vif pour les micro-interactions (hover de carte, etc.).
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 28,
};

// Conteneur orchestrant l'apparition en cascade de ses enfants.
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

// Conteneur a cascade plus serree (listes denses : skills, stats).
export const staggerContainerTight: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

// Enfant : montee douce + fondu. Translation en `y` (transform), jamais `top`.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: springSoft,
  },
};

// Variante plus discrete (faibles deplacements, pour le texte courant).
export const fadeUpSmall: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: springSoft },
};

// Simple fondu (utile pour les overlays / images).
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } },
};

// Apparition avec leger zoom (cartes, media).
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: springSoft },
};

// Reglages partages pour les reveals au scroll : une seule fois, marge haute.
export const revealViewport = { once: true, margin: "-100px" } as const;
