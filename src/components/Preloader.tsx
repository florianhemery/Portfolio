import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";

interface PreloaderProps {
  onDone: () => void;
}

/**
 * Preloader plein ecran : compteur 0 -> 100 en Anton geant + barre de
 * progression, puis le rideau se leve (translation vers le haut) et revele le
 * hero dont la cascade d'entree demarre a ce moment-la (prop `start` du Hero).
 * Volontairement court (~1.4 s). En reduced motion : on saute tout.
 */
export default function Preloader({ onDone }: PreloaderProps) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (reduce) {
      onDone();
      return;
    }
    // Scroll verrouille pendant le chargement.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const controls = animate(0, 100, {
      duration: 1.35,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setValue(Math.round(v)),
      onComplete: () => setExiting(true),
    });
    return () => {
      controls.stop();
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  if (reduce) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[110] flex flex-col justify-between bg-[var(--color-bg)] px-6 py-8 sm:px-12"
      animate={exiting ? { y: "-100%" } : { y: 0 }}
      transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
      onAnimationComplete={() => {
        if (exiting) {
          document.body.style.overflow = "";
          onDone();
        }
      }}
      aria-hidden
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm tracking-tight text-fg">
          FH<span className="text-accent">.</span>
        </span>
        <span className="eyebrow">Portfolio — 2026</span>
      </div>

      <div className="flex items-end justify-between gap-6">
        <span className="eyebrow mb-3 hidden sm:block">
          Florian Hémery — Full-Stack &amp; DevOps
        </span>
        <span className="title-display text-outline select-none leading-none">
          {value}
          <span className="text-accent-bright" style={{ WebkitTextStroke: "0" }}>
            %
          </span>
        </span>
      </div>

      {/* Barre de progression, collee en bas */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10">
        <div
          className="h-full bg-accent transition-[width] duration-100 ease-linear"
          style={{ width: `${value}%` }}
        />
      </div>
    </motion.div>
  );
}
