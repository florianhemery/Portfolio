import type { ReactNode } from "react";
import { motion } from "motion/react";
import RevealText from "./ui/RevealText";
import { fadeUp, revealViewport, staggerContainer } from "../lib/animations";

interface SectionProps {
  id: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Numero editorial de la section (01, 02...) : eyebrow + filigrane geant. */
  index?: number;
  children: ReactNode;
  className?: string;
}

/**
 * En-tete de section reutilisable + conteneur a revelation au scroll.
 * Titres en Anton (display) reveles mot a mot sous masque, numero de section
 * en filigrane geant derriere l'en-tete, enfants en cascade (whileInView).
 */
export default function Section({
  id,
  eyebrow,
  title,
  subtitle,
  index,
  children,
  className = "",
}: SectionProps) {
  const num = index !== undefined ? String(index).padStart(2, "0") : null;

  return (
    <section
      id={id}
      className={`container-editorial relative scroll-mt-28 py-24 sm:py-32 ${className}`}
    >
      {/* Numero de section en filigrane : enorme, en contour, derriere tout */}
      {num && (
        <span
          aria-hidden
          className="title-display text-outline pointer-events-none absolute -top-2 right-0 select-none opacity-[0.16] sm:top-6"
        >
          {num}
        </span>
      )}

      {(eyebrow || title || subtitle) && (
        <motion.header
          className="relative mb-12 max-w-3xl sm:mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
        >
          {eyebrow && (
            <motion.p variants={fadeUp} className="eyebrow mb-4">
              {num && <span className="text-accent-bright">{num}</span>}
              {num && " / "}
              {eyebrow}
            </motion.p>
          )}
          {title && (
            <h2 className="title-h2 text-balance">
              <RevealText text={title} />
            </h2>
          )}
          {subtitle && (
            <motion.p
              variants={fadeUp}
              className="mt-5 text-lg leading-relaxed text-muted"
            >
              {subtitle}
            </motion.p>
          )}
        </motion.header>
      )}
      {children}
    </section>
  );
}

