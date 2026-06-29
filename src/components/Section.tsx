import type { ReactNode } from "react";
import { motion } from "motion/react";
import { fadeUp, revealViewport, staggerContainer } from "../lib/animations";

interface SectionProps {
  id: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

/**
 * En-tete de section reutilisable + conteneur a revelation au scroll.
 * Les enfants apparaissent en cascade (whileInView, une seule fois).
 */
export default function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
}: SectionProps) {
  return (
    <section
      id={id}
      className={`container-editorial scroll-mt-28 py-24 sm:py-32 ${className}`}
    >
      {(eyebrow || title || subtitle) && (
        <motion.header
          className="mb-12 max-w-2xl sm:mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
        >
          {eyebrow && (
            <motion.p variants={fadeUp} className="eyebrow mb-4">
              {eyebrow}
            </motion.p>
          )}
          {title && (
            <motion.h2
              variants={fadeUp}
              className="text-[length:var(--text-h2)] leading-[var(--text-h2--line-height)] tracking-[var(--text-h2--letter-spacing)] font-semibold text-balance"
            >
              {title}
            </motion.h2>
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
