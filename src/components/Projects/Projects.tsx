import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Section from "../Section";
import TiltCard from "../ui/TiltCard";
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

// Note d'un projet en nombre ("17,3" -> 17.3 ; absente -> -1).
function gradeValue(grade?: string | null): number {
  if (!grade) return -1;
  const n = parseFloat(grade.replace(",", "."));
  return Number.isFinite(n) ? n : -1;
}

/** Section "Projets" : Top 5 par defaut, grille filtrable + modale de detail. */
export default function Projects() {
  const { t } = useLang();
  // Vue par defaut : le Top 5 (les meilleures notes). Les categories restent
  // accessibles pour explorer les 70+ autres projets.
  const [activeCategory, setActiveCategory] = useState<string>("top");
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

  // Top 5 : les projets les mieux notes, toutes categories confondues.
  const topProjects = useMemo(
    () =>
      [...allProjects]
        .sort(
          (a, b) => gradeValue(b.project.grade) - gradeValue(a.project.grade)
        )
        .slice(0, 5),
    [allProjects]
  );

  const categories = useMemo(
    () =>
      content.parcoursCategories.map((c) => ({ id: c.id, label: c.label })),
    []
  );

  const visible =
    activeCategory === "top"
      ? topProjects
      : activeCategory === "all"
        ? allProjects
        : allProjects.filter((p) => p.categoryId === activeCategory);

  return (
    <Section
      id="projects"
      index={4}
      eyebrow={t.projects.eyebrow}
      title={t.projects.title}
      subtitle={t.projects.subtitle}
    >
      {/* Filtres par categorie (indicateur actif anime avec layoutId) */}
      <div className="mb-10 flex flex-wrap gap-2">
        {[
          { id: "top", label: t.projects.top5 },
          { id: "all", label: t.projects.all },
          ...categories,
        ].map((cat) => {
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
          {visible.map((item, index) => (
            <motion.div
              key={item.key}
              layout
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, scale: 0.96 }}
              transition={springSnappy}
            >
              <TiltCard className="h-full">
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="glass group relative flex h-full w-full flex-col overflow-hidden rounded-2xl p-5 pt-4 text-left transition-shadow duration-300 hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_45%,transparent),0_18px_50px_-20px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]"
                >
                  {/* Numero d'index geant : contour par defaut, se remplit a
                      l'accent au survol (signature editoriale de la grille). */}
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span
                      aria-hidden
                      className="title-h2 text-outline select-none leading-none transition-all duration-300 group-hover:text-accent-bright group-hover:[-webkit-text-stroke:0px]"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.project.grade && (
                      <span className="mt-1 shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-xs text-accent-bright">
                        {clean(item.project.grade)}
                      </span>
                    )}
                  </div>
                  <span className="eyebrow">{item.categoryLabel}</span>
                  <h3 className="mt-1.5 text-xl font-semibold text-fg">
                    {clean(item.project.title)}
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
                    {clean(item.project.longDesc)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent-bright opacity-0 transition-all duration-300 group-hover:opacity-100">
                    {t.projects.open}
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                  {/* Halo d'accent au survol, dans le coin du numero */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(closest-side, color-mix(in srgb, var(--color-accent) 35%, transparent), transparent)",
                    }}
                  />
                </button>
              </TiltCard>
            </motion.div>
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
