import { motion } from "motion/react";
import Section from "../Section";
import { content } from "../../config/content";
import { useLang } from "../../i18n/LangContext";
import { clean } from "../../lib/text";
import { fadeUp, revealViewport, staggerContainer } from "../../lib/animations";

/** Section "Parcours" : frise verticale a partir de parcoursSteps. */
export default function Timeline() {
  const { t } = useLang();

  return (
    <Section
      id="timeline"
      index={3}
      eyebrow={t.timeline.eyebrow}
      title={t.timeline.title}
      subtitle={t.timeline.subtitle}
    >
      <motion.ol
        className="relative ml-3 border-l border-[var(--color-line-strong)]"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
      >
        {content.parcoursSteps.map((step) => {
          const isPro = step.tag === "Pro";
          return (
            <motion.li
              key={step.id}
              variants={fadeUp}
              className="relative mb-10 pl-8 last:mb-0"
            >
              {/* Pastille sur la frise */}
              <span
                aria-hidden
                className={`absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full border-2 ${
                  isPro
                    ? "border-accent bg-accent"
                    : "border-[var(--color-line-strong)] bg-[var(--color-bg)]"
                }`}
              />
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-faint">
                  {clean(step.year)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.65rem] uppercase tracking-wider ${
                    isPro
                      ? "bg-accent/15 text-accent-bright"
                      : "border border-[var(--color-line)] text-faint"
                  }`}
                >
                  {step.tag}
                </span>
              </div>
              <h3 className="mt-2 text-xl font-semibold text-fg">
                {clean(step.title)}
              </h3>
              <p className="mt-1.5 max-w-2xl leading-relaxed text-muted">
                {clean(step.desc)}
              </p>
            </motion.li>
          );
        })}
      </motion.ol>
    </Section>
  );
}
