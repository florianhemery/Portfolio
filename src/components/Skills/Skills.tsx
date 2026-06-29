import { useMemo } from "react";
import { motion } from "motion/react";
import Section from "../Section";
import { content } from "../../config/content";
import { useLang } from "../../i18n/LangContext";
import type { Skill, SkillCategory } from "../../types";
import { fadeUp, revealViewport, staggerContainer } from "../../lib/animations";

// Ordre d'affichage des categories.
const CATEGORY_ORDER: SkillCategory[] = [
  "Systems",
  "Frontend",
  "Backend",
  "DevOps",
  "Data",
];

/** Section "Competences" : skills regroupes par domaine, en cartes de verre. */
export default function Skills() {
  const { t } = useLang();

  // Regroupe les skills par categorie en respectant l'ordre defini.
  const grouped = useMemo(() => {
    const map = new Map<SkillCategory, Skill[]>();
    for (const skill of content.skills) {
      const list = map.get(skill.category) ?? [];
      list.push(skill);
      map.set(skill.category, list);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((category) => ({
      category,
      skills: map.get(category)!,
    }));
  }, []);

  return (
    <Section
      id="skills"
      eyebrow={t.skills.eyebrow}
      title={t.skills.title}
      subtitle={t.skills.subtitle}
    >
      <motion.div
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
      >
        {grouped.map(({ category, skills }) => (
          <motion.div
            key={category}
            variants={fadeUp}
            className="glass rounded-2xl p-6"
          >
            <h3 className="eyebrow mb-5">{category}</h3>
            <ul className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <li
                  key={skill.name}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/60 px-3 py-1.5 text-sm text-fg"
                >
                  <span aria-hidden className="text-accent-bright">
                    {skill.icon}
                  </span>
                  {skill.name}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
