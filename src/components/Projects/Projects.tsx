import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Section from "../Section";
import ProjectModal from "./ProjectModal";
import { content } from "../../config/content";
import { useLang } from "../../i18n/LangContext";
import { clean } from "../../lib/text";
import type { Project } from "../../types";
import {
  fadeUp,
  revealViewport,
  springSnappy,
  staggerContainerTight,
} from "../../lib/animations";

// Projet aplati avec sa categorie d'origine (pour le filtrage et la modale).
interface FlatProject {
  project: Project;
  categoryId: string;
  categoryLabel: string;
  key: string;
}

/** Section "Projets" : grille filtrable par categorie + modale de detail. */
export default function Projects() {
  const { t } = useLang();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selected, setSelected] = useState<FlatProject | null>(null);

  // Aplatit toutes les categories en une liste unique de projets.
  const allProjects = useMemo<FlatProject[]>(() => {
    return content.parcoursCategories.flatMap((category) =>
      category.projects.map((project, index) => ({
        project,
        categoryId: category.id,
        categoryLabel: category.label,
        key: `${category.id}-${index}`,
      }))
    );
  }, []);

  const categories = useMemo(
    () =>
      content.parcoursCategories.map((c) => ({ id: c.id, label: c.label })),
    []
  );

  const visible =
    activeCategory === "all"
      ? allProjects
      : allProjects.filter((p) => p.categoryId === activeCategory);

  return (
    <Section
      id="projects"
      eyebrow={t.projects.eyebrow}
      title={t.projects.title}
      subtitle={t.projects.subtitle}
    >
      {/* Filtres par categorie (indicateur actif anime avec layoutId) */}
      <div className="mb-10 flex flex-wrap gap-2">
        {[{ id: "all", label: t.projects.all }, ...categories].map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`relative rounded-full px-4 py-1.5 text-sm transition-colors ${
                isActive ? "text-white" : "text-muted hover:text-fg"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="project-filter-active"
                  className="absolute inset-0 -z-10 rounded-full bg-accent"
                  transition={springSnappy}
                />
              )}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grille de projets */}
      <motion.div
        layout
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
        variants={staggerContainerTight}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
      >
        <AnimatePresence mode="popLayout">
          {visible.map((item) => (
            <motion.button
              key={item.key}
              type="button"
              layout
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={() => setSelected(item)}
              whileHover={{ y: -4 }}
              transition={springSnappy}
              className="glass group flex flex-col rounded-2xl p-5 text-left transition-shadow hover:shadow-[0_0_0_1px_rgba(31,60,255,0.45),0_18px_50px_-20px_rgba(31,60,255,0.55)]"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="eyebrow">{item.categoryLabel}</span>
                {item.project.grade && (
                  <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-xs text-accent-bright">
                    {clean(item.project.grade)}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-fg">
                {clean(item.project.title)}
              </h3>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
                {clean(item.project.longDesc)}
              </p>
              <span className="mt-4 text-sm text-accent-bright opacity-0 transition-opacity group-hover:opacity-100">
                {t.projects.open} →
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Modale de detail */}
      <AnimatePresence>
        {selected && (
          <ProjectModal
            project={selected.project}
            categoryLabel={selected.categoryLabel}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </Section>
  );
}
