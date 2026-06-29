import { lazy, Suspense } from "react";
import Nav from "./components/Nav/Nav";
import Hero from "./components/Hero/Hero";
import About from "./components/About/About";
import Skills from "./components/Skills/Skills";
import Timeline from "./components/Timeline/Timeline";
import Projects from "./components/Projects/Projects";
import Stats from "./components/Stats/Stats";
import Testimonials from "./components/Testimonials/Testimonials";
import Contact from "./components/Contact/Contact";
import { content } from "./config/content";
import { useLang } from "./i18n/LangContext";

// Couche 3D chargee paresseusement : elle ne doit jamais bloquer le 1er rendu.
const ParticleField = lazy(() => import("./three/ParticleField"));

export default function App() {
  const { personal } = content;
  const { t } = useLang();

  return (
    <>
      {/* Champ de particules WebGL, fixe en fond de page (derriere le contenu). */}
      <Suspense fallback={null}>
        <ParticleField />
      </Suspense>

      {/* .grain applique l'overlay de bruit subtil ; z-10 pour passer au-dessus
          du canvas 3D tout en restant sous l'overlay de grain. */}
      <div className="grain relative z-10 min-h-svh">
        <Nav />

        <main>
          {/* Hero : transparent, pleine puissance du champ de particules. */}
          <Hero />

          {/* Sections de contenu sur voile sombre pour la lisibilite. */}
          <div className="content-scrim">
            <About />
            <Skills />
            <Timeline />
            <Projects />
            <Stats />
            <Testimonials />
            <Contact />
          </div>
        </main>

        <footer className="content-scrim border-t border-[var(--color-line)]">
          <div className="container-editorial flex flex-col gap-2 py-10 text-sm text-faint sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {personal.name}. {t.footer.rights}
            </p>
            <p>
              {t.footer.built} {personal.name}.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
