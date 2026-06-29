import { motion } from "motion/react";
import { content } from "../../config/content";
import { useLang } from "../../i18n/LangContext";
import { fadeUp, revealViewport, scaleIn, staggerContainer } from "../../lib/animations";

/** Section "A propos" : portrait + biographie + point fort. */
export default function About() {
  const { personal } = content;
  const { t } = useLang();

  return (
    <section id="about" className="container-editorial scroll-mt-28 py-24 sm:py-32">
      <motion.div
        className="grid items-center gap-10 md:grid-cols-[0.8fr_1fr] md:gap-16"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
      >
        {/* Portrait */}
        <motion.div variants={scaleIn} className="relative mx-auto max-w-sm md:mx-0">
          <div className="glass overflow-hidden rounded-2xl p-2">
            <img
              src={personal.photo}
              alt={personal.name}
              loading="lazy"
              className="aspect-[4/5] w-full rounded-xl object-cover"
            />
          </div>
          {/* Halo d'accent derriere le portrait */}
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-[2rem] opacity-60 blur-2xl"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 40%, rgba(31,60,255,0.3), transparent 70%)",
            }}
          />
        </motion.div>

        {/* Texte */}
        <div>
          <motion.p variants={fadeUp} className="eyebrow mb-4">
            {t.about.eyebrow}
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-[length:var(--text-h2)] leading-[var(--text-h2--line-height)] tracking-[var(--text-h2--letter-spacing)] font-semibold text-balance"
          >
            {t.about.title}
          </motion.h2>
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
