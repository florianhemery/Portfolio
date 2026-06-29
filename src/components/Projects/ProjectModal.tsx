import { useEffect } from "react";
import { motion } from "motion/react";
import type { Project } from "../../types";
import { useLang } from "../../i18n/LangContext";
import { clean } from "../../lib/text";

interface ProjectModalProps {
  project: Project;
  categoryLabel: string;
  onClose: () => void;
}

/** Modale de detail d'un projet (titre, module, note, description, skills). */
export default function ProjectModal({
  project,
  categoryLabel,
  onClose,
}: ProjectModalProps) {
  const { t } = useLang();

  // Fermeture par Echap + verrouillage du scroll de la page pendant l'ouverture.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Voile cliquable */}
      <button
        type="button"
        aria-label={t.projects.close}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={clean(project.title)}
        className="glass-panel relative z-10 w-full max-w-xl rounded-2xl p-6 sm:p-8"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t.projects.close}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] text-muted transition-colors hover:border-accent hover:text-accent"
        >
          ✕
        </button>

        <p className="eyebrow mb-3">{categoryLabel}</p>
        <h3 className="pr-8 text-2xl font-semibold tracking-tight text-fg">
          {clean(project.title)}
        </h3>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-faint">
            {clean(project.year)}
          </span>
          {project.module && (
            <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-faint">
              {t.projects.module}: {clean(project.module)}
            </span>
          )}
          {project.grade && (
            <span className="rounded-full bg-accent/15 px-3 py-1 text-accent-bright">
              {t.projects.grade}: {clean(project.grade)}
            </span>
          )}
        </div>

        <p className="mt-5 leading-relaxed text-muted">
          {clean(project.longDesc)}
        </p>

        {project.skills.length > 0 && (
          <div className="mt-6">
            <p className="eyebrow mb-3">{t.projects.skills}</p>
            <ul className="flex flex-wrap gap-2">
              {project.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/60 px-3 py-1 text-sm text-fg"
                >
                  {clean(skill)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
