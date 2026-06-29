import { motion } from "motion/react";
import Section from "../Section";
import { content } from "../../config/content";
import { useLang } from "../../i18n/LangContext";
import { clean } from "../../lib/text";
import { fadeUp, revealViewport, staggerContainer } from "../../lib/animations";

/** Section "Temoignages" : citations issues de content.testimonials. */
export default function Testimonials() {
  const { t, lang } = useLang();

  return (
    <Section
      id="testimonials"
      eyebrow={t.testimonials.eyebrow}
      title={t.testimonials.title}
    >
      <motion.div
        className="grid gap-5 md:grid-cols-2"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
      >
        {content.testimonials.map((item) => {
          // FR : text_fr ; EN : text d'origine (anglais).
          const text = lang === "fr" ? item.text_fr : item.text;
          const role = lang === "fr" ? item.role : item.role_en;
          return (
            <motion.figure
              key={item.id}
              variants={fadeUp}
              className="glass flex flex-col rounded-2xl p-7"
            >
              <span aria-hidden className="text-4xl leading-none text-accent">
                &ldquo;
              </span>
              <blockquote className="mt-2 flex-1 text-lg leading-relaxed text-fg">
                {clean(text)}
              </blockquote>
              <figcaption className="mt-6 border-t border-[var(--color-line)] pt-4">
                <span className="font-semibold text-fg">{item.author}</span>
                <span className="block text-sm text-faint">{clean(role)}</span>
              </figcaption>
            </motion.figure>
          );
        })}
      </motion.div>
    </Section>
  );
}
