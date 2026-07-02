import { motion, useReducedMotion } from "motion/react";
import { content } from "../../config/content";
import { useLang } from "../../i18n/LangContext";
import { springSoft } from "../../lib/animations";
import Magnetic from "../ui/Magnetic";
import RevealText from "../ui/RevealText";

interface HeroProps {
  /** false tant que le preloader est a l'ecran : la cascade attend le rideau. */
  start: boolean;
}

/**
 * Hero : premiere impression du portfolio.
 * Nom en Anton geant revele mot a mot sous masque, cascade d'entree (eyebrow,
 * titre, CTA magnetiques) declenchee a la fin du preloader. Tout se replie sur
 * un simple fondu si l'utilisateur a demande la reduction des animations.
 */
export default function Hero({ start }: HeroProps) {
  const { personal } = content;
  const { t } = useLang();
  const reduce = useReducedMotion();

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
        animate={start ? "show" : "hidden"}
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

        {/* Nom : Anton geant, chaque mot revele sous masque. Les variants sont
            herites du conteneur (hidden tant que le preloader est a l'ecran). */}
        <h1 className="title-display">
          <span className="block text-fg">
            <RevealText text="Florian" inView={false} />
          </span>
          <span className="block text-gradient-accent">
            <RevealText text="Hémery" inView={false} delay={0.12} />
          </span>
        </h1>

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

        {/* CTA : projets + contact, magnetiques */}
        <motion.div variants={item} className="mt-10 flex flex-wrap gap-4">
          <Magnetic>
            <a
              href="#projects"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-colors duration-300"
            >
              {t.hero.ctaProjects}
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="#contact"
              className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-fg transition-colors duration-200 hover:text-accent-bright"
            >
              {t.hero.ctaContact}
            </a>
          </Magnetic>
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
            className="link-underline transition-colors hover:text-fg"
          >
            GitHub
          </a>
          <a
            href={personal.linkedin}
            target="_blank"
            rel="noreferrer"
            className="link-underline transition-colors hover:text-fg"
          >
            LinkedIn
          </a>
          <a
            href={`mailto:${personal.email}`}
            className="link-underline transition-colors hover:text-fg"
          >
            {personal.email}
          </a>
        </motion.div>
      </motion.div>

      {/* Indicateur de scroll : petit fil vertical anime en bas de l'ecran */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: start ? 1 : 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <span className="eyebrow">{t.hero.scroll}</span>
          <span className="relative block h-12 w-px overflow-hidden bg-white/15">
            <motion.span
              className="absolute left-0 top-0 block h-4 w-px bg-accent-bright"
              animate={{ y: [-16, 48] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        </motion.div>
      )}
    </section>
  );
}
