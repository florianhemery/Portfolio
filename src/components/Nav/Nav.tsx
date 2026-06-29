import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useLang } from "../../i18n/LangContext";
import { springSnappy } from "../../lib/animations";

/**
 * Navigation flottante en pilule de verre (liquid glass).
 * Indicateur d'onglet actif anime via layoutId, scroll-spy par
 * IntersectionObserver, et bascule de langue FR / EN.
 */
export default function Nav() {
  const { t, lang, toggle } = useLang();
  const [active, setActive] = useState<string>("hero");

  const links = [
    { id: "about", label: t.nav.about },
    { id: "skills", label: t.nav.skills },
    { id: "timeline", label: t.nav.timeline },
    { id: "projects", label: t.nav.projects },
  ];

  // Scroll-spy : la section qui croise le centre du viewport devient active.
  useEffect(() => {
    const ids = ["hero", ...links.map((l) => l.id), "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // links depend de la langue mais les id sont stables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="glass flex items-center gap-1 rounded-full p-1.5 pl-4">
        <a
          href="#hero"
          className="mr-1 font-mono text-sm tracking-tight text-fg"
          aria-label={t.nav.backToTop}
        >
          FH<span className="text-accent">.</span>
        </a>

        <div className="hidden items-center gap-1 sm:flex">
          {links.map((link) => {
            const isActive = active === link.id;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`relative rounded-full px-3 py-1.5 text-sm transition-colors ${
                  isActive ? "text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded-full bg-white/8"
                    transition={springSnappy}
                  />
                )}
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Bascule de langue */}
        <button
          type="button"
          onClick={toggle}
          aria-label={t.nav.toggleLang}
          className="ml-1 rounded-full border border-[var(--color-line)] px-2.5 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent"
        >
          {lang === "fr" ? "EN" : "FR"}
        </button>

        <a
          href="#contact"
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.04]"
        >
          {t.nav.contact}
        </a>
      </nav>
    </header>
  );
}
