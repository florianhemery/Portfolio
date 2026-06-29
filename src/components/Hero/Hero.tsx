import { motion, useReducedMotion } from "motion/react";
import { content } from "../../config/content";
import { useLang } from "../../i18n/LangContext";
import { springSoft } from "../../lib/animations";

/**
 * Hero : premiere impression du portfolio.
 * Entree en cascade (eyebrow, nom, titre, sous-titre, CTA) avec spring physics.
 * Toutes les animations se replient sur un simple fondu si l'utilisateur a
 * demande la reduction des animations au niveau de l'OS.
 */
export default function Hero() {
  const { personal } = content;
  const { t } = useLang();
  const reduce = useReducedMotion();

  const [firstName, ...rest] = personal.name.split(" ");
  const lastName = rest.join(" ");

  // Variants locaux, accordes au reglage "reduce motion".
  const container = {
    hidden: {},
    show: {
      transition: reduce
        ? { staggerChildren: 0 }
        : { staggerChildren: 0.09, delayChildren: 0.1 },
    },
  };

  const item = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 22 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduce ? { duration: 0.3 } : springSoft,
    },
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-svh items-center overflow-hidden pt-28 pb-20"
    >
      {/* Scrim de lisibilite : voile sombre doux ancre a gauche, fondu vers la
          droite. Renforce le contraste du texte sans masquer les particules. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 80% at 18% 50%, rgba(10,10,11,0.82), rgba(10,10,11,0.45) 45%, transparent 72%)",
        }}
      />

      <motion.div
        className="container-editorial relative"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Eyebrow : statut + promo */}
        <motion.div
          variants={item}
          className="mb-7 flex flex-wrap items-center gap-x-4 gap-y-2"
        >
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            {t.hero.status}
          </span>
          <span className="eyebrow">{personal.subtitle.replace(/—/g, "-")}</span>
        </motion.div>

        {/* Nom : titre display, tres grand et serre */}
        <motion.h1
          variants={item}
          className="font-sans text-[length:var(--text-display)] leading-[var(--text-display--line-height)] tracking-[var(--text-display--letter-spacing)] font-semibold"
        >
          <span className="block text-fg">{firstName}</span>
          <span className="block text-gradient-accent">{lastName}</span>
        </motion.h1>

        {/* Titre de poste */}
        <motion.p
          variants={item}
          className="mt-6 max-w-2xl text-xl text-fg sm:text-2xl"
        >
          {personal.title}
        </motion.p>

        {/* Accroche */}
        <motion.p
          variants={item}
          className="mt-4 max-w-xl text-base leading-relaxed text-faint"
        >
          {t.hero.accroche}
        </motion.p>

        {/* CTA : projets + contact */}
        <motion.div variants={item} className="mt-10 flex flex-wrap gap-4">
          <a
            href="#projects"
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.03] focus-visible:scale-[1.03]"
          >
            {t.hero.ctaProjects}
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </a>
          <a
            href="#contact"
            className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-fg transition-colors duration-200 hover:text-accent"
          >
            {t.hero.ctaContact}
          </a>
        </motion.div>

        {/* Liens rapides */}
        <motion.div
          variants={item}
          className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-faint"
        >
          <a
            href={personal.github}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-fg"
          >
            GitHub
          </a>
          <a
            href={personal.linkedin}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-fg"
          >
            LinkedIn
          </a>
          <a
            href={`mailto:${personal.email}`}
            className="transition-colors hover:text-fg"
          >
            {personal.email}
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
