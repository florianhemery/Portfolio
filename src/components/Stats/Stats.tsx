import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import Section from "../Section";
import { content } from "../../config/content";
import { useLang } from "../../i18n/LangContext";
import { fadeUp, revealViewport, staggerContainer } from "../../lib/animations";

/** Compteur anime (count-up) declenche a l'entree dans le viewport. */
function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

/** Section "En chiffres" : les stats avec animation count-up. */
export default function Stats() {
  const { t } = useLang();

  return (
    <Section id="stats" index={5} eyebrow={t.stats.eyebrow} title={t.stats.title}>
      <motion.div
        className="grid gap-5 sm:grid-cols-2"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
      >
        {content.stats.map((stat) => (
          <motion.div
            key={stat.id}
            variants={fadeUp}
            className="glass rounded-2xl p-8"
          >
            <div className="text-gradient-accent text-5xl font-semibold tracking-tight sm:text-6xl">
              <CountUp value={stat.value} suffix={stat.suffix} />
            </div>
            <p className="mt-3 text-muted">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
