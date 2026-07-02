import { motion } from "motion/react";
import { content } from "../../config/content";
import { useLang } from "../../i18n/LangContext";
import { fadeUp, revealViewport, scaleIn, staggerContainer } from "../../lib/animations";
import RevealText from "../ui/RevealText";
import TiltCard from "../ui/TiltCard";

/** Section "A propos" : portrait + biographie + point fort. */
export default function About() {
  const { personal } = content;
  const { t } = useLang();

  return (
    <section
      id="about"
      className="container-editorial relative scroll-mt-28 py-24 sm:py-32"
    >
      {/* Numero de section en filigrane (coherent avec les autres sections) */}
      <span
        aria-hidden
        className="title-display text-outline pointer-events-none absolute -top-2 right-0 select-none opacity-[0.16] sm:top-6"
      >
        01
      </span>
      <motion.div
        className="grid items-center gap-10 md:grid-cols-[0.8fr_1fr] md:gap-16"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
      >
        {/* Portrait (tilt 3D au survol) */}
        <motion.div variants={scaleIn} className="relative mx-auto max-w-sm md:mx-0">
          <TiltCard max={5}>
            <div className="glass overflow-hidden rounded-2xl p-2">
              <img
                src={personal.photo}
                alt={personal.name}
                loading="lazy"
                className="aspect-[4/5] w-full rounded-xl object-cover"
              />
            </div>
          </TiltCard>
          {/* Halo d'accent derriere le portrait (suit la teinte de section) */}
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-[2rem] opacity-60 blur-2xl"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 40%, color-mix(in srgb, var(--color-accent) 30%, transparent), transparent 70%)",
            }}
          />
        </motion.div>

        {/* Texte */}
        <div>
          <motion.p variants={fadeUp} className="eyebrow mb-4">
            <span className="text-accent-bright">01</span> / {t.about.eyebrow}
          </motion.p>
          <h2 className="title-h2 text-balance">
            <RevealText text={t.about.title} />
          </h2>
          <motion.p
            variants={fadeUp}
            className="mt-6 text-lg leading-relaxed text-muted"
          >
            {t.about.bio}
          </motion.p>
          <motion.p
            variants={fadeUp}
            className="glass mt-6 inline-block rounded-xl px-4 py-3 text-sm text-fg"
          >
            {t.about.highlight}
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
