import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";

import {
  particleFragmentShader,
  particleVertexShader,
} from "./particleShaders";
import {
  buildContactPositions,
  buildGlyphPositions,
  buildLogoPositions,
  computeContactLayout,
  computeLogoLayout,
  computePortraitLayout,
  generateFormations,
} from "./formations";
import {
  cappedPixelRatio,
  getParticleCount,
  hasWebGL,
  isSoftwareRenderer,
} from "./webgl";

// Valeur fixe de uProgress en reduced motion : on fige sur le reseau (formation
// lisible et representative), sans aucun morphing ni mouvement continu.
const REDUCED_PROGRESS = 0.4;

// Calage des formations sur les sections : chaque section vise une valeur de
// uProgress. La formation ILLUSTRE la section : 0 logo Epitech (hero, conserve),
// 0.2 portrait (a propos), 0.4 reseau en grappes (competences), 0.6 frise
// ascendante (parcours), 0.8 mur de cartes (projets), 1.0 glyphe "@" (contact).
const SECTION_KEYFRAMES: Array<{ id: string; p: number }> = [
  { id: "hero", p: 0.0 },
  { id: "about", p: 0.2 },
  { id: "skills", p: 0.4 },
  { id: "timeline", p: 0.6 },
  { id: "projects", p: 0.8 },
  { id: "stats", p: 0.8 },
  { id: "testimonials", p: 0.8 },
  { id: "contact", p: 1.0 },
];

// Rampe de couleurs des particules, calee sur les memes accents que l'UI
// (voir lib/sectionTheme.ts) : la nuee change subtilement de teinte en
// meme temps que les halos et boutons de la page.
const COLOR_RAMP: Array<[string, string]> = [
  ["#1f3cff", "#5ec8ff"], // hero      : bleu Epitech
  ["#6366f1", "#a5b4fc"], // a propos  : indigo
  ["#06b6d4", "#67e8f9"], // skills    : cyan
  ["#3b82f6", "#93c5fd"], // parcours  : bleu clair
  ["#8b5cf6", "#c4b5fd"], // projets   : violet
  ["#e879f9", "#f0abfc"], // contact   : fuchsia
];
const RAMP_A = COLOR_RAMP.map(([a]) => new THREE.Color(a));
const RAMP_B = COLOR_RAMP.map(([, b]) => new THREE.Color(b));

interface SharedRefs {
  // Progression de scroll cible (0..1) et indicateur "la page est scrollable".
  scrollProgress: React.RefObject<number>;
  scrollable: React.RefObject<boolean>;
  // Horodatage de la derniere interaction de scroll (pilotage du framerate).
  lastScroll: React.RefObject<number>;
  // Vitesse de morphing lissee (0..1), partagee avec le post-processing.
  velocity: React.RefObject<number>;
}

interface ParticlesProps extends SharedRefs {
  reduced: boolean;
  count: number;
}

/** La nuee de particules elle-meme (dans la scene R3F). */
function Particles({
  reduced,
  count,
  scrollProgress,
  scrollable,
  velocity,
}: ParticlesProps) {
  const groupRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Override manuel de uProgress (outil de debug en dev : window.__setProgress).
  // null => pilotage par le scroll (ou demo automatique si page trop courte).
  const manualProgress = useRef<number | null>(null);

  const { logo, scatter, portrait, network, timeline, cards, contact, seeds } =
    useMemo(() => generateFormations(count), [count]);

  // Accumulateur de rotation : la rotation ne s'installe qu'autour du reseau
  // (formation abstraite) ; les formations figuratives (logo, portrait, frise,
  // cartes, "@") restent face camera pour rester lisibles.
  const spin = useRef(0);

  // Uniforms crees une seule fois ; mis a jour dans la boucle de rendu.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 34 }, // points compacts : limite l'overdraw additif
      uPixelRatio: { value: cappedPixelRatio() },
      uReduced: { value: reduced ? 1 : 0 },
      uProgress: { value: 0 },
      // Assemblage d'intro : la nuee arrive du chaos et forme le logo.
      uIntro: { value: reduced ? 0 : 1 },
      uVelocity: { value: 0 },
      uColorA: { value: new THREE.Color(COLOR_RAMP[0][0]) },
      uColorB: { value: new THREE.Color(COLOR_RAMP[0][1]) },
    }),
    // `reduced` ne change pas en cours de session ; capture initiale suffisante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const invalidate = useThree((s) => s.invalidate);
  // On selectionne des primitives (pas l'objet viewport) pour eviter tout
  // re-render superflu lors des redimensionnements.
  const vw = useThree((s) => s.viewport.width);
  const vh = useThree((s) => s.viewport.height);

  // Met a jour un attribut en place (et repeint).
  const setAttr = (name: string, arr: Float32Array) => {
    const attr = groupRef.current?.geometry.getAttribute(name) as
      | THREE.BufferAttribute
      | undefined;
    if (attr) {
      (attr.array as Float32Array).set(arr);
      attr.needsUpdate = true;
      invalidate();
    }
  };

  // Re-echantillonne les glyphes (logo "{ EPITECH }" et "@") : une fois la
  // police Anton chargee, et a chaque changement de taille d'ecran.
  // Debounce pour absorber les resize continus.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          if (document.fonts?.load) {
            await document.fonts.load('100px "Anton"');
            await document.fonts.ready;
          }
        } catch {
          // police indisponible : on garde l'echantillonnage initial.
        }
        if (cancelled) return;
        setAttr(
          "aLogo",
          buildLogoPositions(count, scatter, computeLogoLayout(vw, vh))
        );
        setAttr(
          "aContact",
          buildContactPositions(count, scatter, computeContactLayout(vw, vh))
        );
      })();
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, scatter, vw, vh, invalidate]);

  // Monogramme "FH." (section "A propos") : echo de la signature de la nav.
  // On ne redessine PAS le portrait en particules (la photo est deja affichee
  // juste a cote : ce serait un doublon).
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          if (document.fonts?.load) {
            await document.fonts.load('100px "Anton"');
            await document.fonts.ready;
          }
        } catch {
          // police indisponible : on garde l'echantillonnage initial.
        }
        if (cancelled) return;
        const layout = computePortraitLayout(vw, vh);
        setAttr(
          "aPortrait",
          buildGlyphPositions(count, scatter, [{ text: "FH.", size: 380 }], {
            ...layout,
            worldWidth: Math.min(layout.worldWidth * 1.5, 11),
          })
        );
      })();
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, scatter, vw, vh, invalidate]);

  // Outil de debug (dev uniquement) : permet de figer une formation precise
  // depuis la console. window.__setProgress(0.6) ou window.__setProgress(null).
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as Record<string, unknown>;
    w.__setProgress = (v: number | null) => {
      manualProgress.current = v;
    };
    w.__getProgress = () => materialRef.current?.uniforms.uProgress.value;
  }, []);

  useFrame((state, delta) => {
    const mat = materialRef.current;
    if (!mat) return;

    if (reduced) {
      // Formation statique : rien ne bouge, teinte de la section figee.
      mat.uniforms.uProgress.value = REDUCED_PROGRESS;
      mat.uniforms.uIntro.value = 0;
      const i = Math.round(REDUCED_PROGRESS * 5);
      (mat.uniforms.uColorA.value as THREE.Color).copy(RAMP_A[i]);
      (mat.uniforms.uColorB.value as THREE.Color).copy(RAMP_B[i]);
      return;
    }

    // delta peut etre grand quand le rendu a ete mis en pause : on le borne
    // pour eviter tout saut a la reprise.
    const dt = Math.min(delta, 0.05);
    mat.uniforms.uTime.value += dt;

    // Assemblage d'intro : uIntro decroit vers 0 (~1.6 s), la nuee converge
    // du chaos vers le logo.
    if (mat.uniforms.uIntro.value > 0.001) {
      mat.uniforms.uIntro.value +=
        (0 - mat.uniforms.uIntro.value) * Math.min(1, dt * 2.2);
    } else {
      mat.uniforms.uIntro.value = 0;
    }

    // Cible de progression :
    //  - override manuel (debug) si defini ;
    //  - sinon le scroll de la page si elle est assez haute pour defiler ;
    //  - sinon un aller-retour doux de demonstration (page courte).
    let target: number;
    if (manualProgress.current !== null) {
      target = manualProgress.current;
    } else if (scrollable.current) {
      target = scrollProgress.current;
    } else {
      const elapsed = state.clock.elapsedTime;
      target = Math.sin(elapsed * 0.16 - Math.PI / 2) * 0.5 + 0.5;
    }

    // Lissage (damping) vers la cible : transitions fluides, jamais de saut.
    const current = mat.uniforms.uProgress.value;
    const next = current + (target - current) * Math.min(1, dt * 3.2);
    mat.uniforms.uProgress.value = next;

    // Vitesse de morphing (lissee) : alimente la teinte + l'aberration
    // chromatique du post-processing.
    const instant = Math.abs(next - current) / Math.max(dt, 0.0001);
    const vel = mat.uniforms.uVelocity.value;
    const smoothVel = vel + (instant * 1.4 - vel) * 0.12;
    mat.uniforms.uVelocity.value = smoothVel;
    velocity.current = smoothVel;

    // Couleurs : glissement le long de la rampe, cale sur uProgress (la nuee
    // change de teinte en meme temps que l'UI de la section visible).
    const t = Math.min(Math.max(next, 0), 1) * (COLOR_RAMP.length - 1);
    const i0 = Math.min(Math.floor(t), COLOR_RAMP.length - 2);
    const f = t - i0;
    (mat.uniforms.uColorA.value as THREE.Color)
      .copy(RAMP_A[i0])
      .lerp(RAMP_A[i0 + 1], f);
    (mat.uniforms.uColorB.value as THREE.Color)
      .copy(RAMP_B[i0])
      .lerp(RAMP_B[i0 + 1], f);

    // Rotation : uniquement autour du reseau (p ~ 0.4), seule formation
    // abstraite qui gagne a tourner. Fenetre gaussienne douce.
    spin.current += dt * 0.05;
    if (groupRef.current) {
      const d = (next - 0.4) / 0.09;
      const reveal = Math.exp(-d * d);
      groupRef.current.rotation.y = spin.current * reveal;
      groupRef.current.rotation.x = spin.current * 0.28 * reveal;
    }
  });

  return (
    <points ref={groupRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[scatter, 3]} />
        <bufferAttribute attach="attributes-aLogo" args={[logo, 3]} />
        <bufferAttribute attach="attributes-aPortrait" args={[portrait, 3]} />
        <bufferAttribute attach="attributes-aNetwork" args={[network, 3]} />
        <bufferAttribute attach="attributes-aTimeline" args={[timeline, 3]} />
        <bufferAttribute attach="attributes-aCards" args={[cards, 3]} />
        <bufferAttribute attach="attributes-aContact" args={[contact, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
        transparent
      />
    </points>
  );
}

/**
 * Pilote le rythme de rendu (frameloop "demand") pour economiser le GPU :
 *  - pendant le scroll : 45 fps (morphing fluide) ;
 *  - au repos : 24 fps (la nuee continue d'onduler, jamais figee) ;
 *  - onglet masque : aucune frame.
 */
function RenderDriver({
  reduced,
  lastScroll,
}: {
  reduced: boolean;
  lastScroll: React.RefObject<number>;
}) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    invalidate(); // toujours peindre une premiere frame
    if (reduced) return; // statique : pas de boucle

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      // Onglet masque : aucune frame (economie totale).
      if (document.hidden) {
        last = now;
        return;
      }
      // Animation continue : plus rapide pendant le scroll (morphing fluide),
      // et un rythme doux au repos pour que la nuee continue d'onduler sans
      // jamais se figer.
      const sinceScroll = now - lastScroll.current;
      const fps = sinceScroll < 500 ? 45 : 24;
      if (now - last >= 1000 / fps) {
        last = now;
        invalidate();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, reduced, lastScroll]);

  return null;
}

/**
 * Aberration chromatique pilotee par la vitesse de morphing : les couleurs se
 * dedoublent pendant les transitions rapides (effet "lentille" cinetique),
 * et redeviennent parfaitement nettes au repos.
 */
function AberrationDriver({
  velocity,
  offset,
}: {
  velocity: React.RefObject<number>;
  offset: THREE.Vector2;
}) {
  useFrame(() => {
    const v = Math.min(velocity.current, 1);
    offset.x = v * 0.0022;
    offset.y = v * 0.0012;
  });
  return null;
}

/** Fallback sobre quand WebGL n'est pas disponible : halos d'accent. */
function FieldFallback() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-0"
      style={{
        background:
          "radial-gradient(40rem 32rem at 70% 30%, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 60%), radial-gradient(36rem 36rem at 15% 75%, color-mix(in srgb, var(--color-accent-bright) 8%, transparent), transparent 60%)",
      }}
    />
  );
}

/**
 * Couche 3D plein ecran, fixee derriere le contenu.
 * Rendu a la demande, rythme par RenderDriver (perfs).
 */
export default function ParticleField() {
  const reduced = useReducedMotion() ?? false;
  const [webgl] = useState(() => hasWebGL());

  // Profil de rendu : sur un moteur logiciel/bas de gamme, on reduit le nombre
  // de particules et on coupe le post-processing pour preserver la fluidite.
  const [software] = useState(() => isSoftwareRenderer());
  const count = software ? 8000 : getParticleCount();
  const enableFx = !software;

  const scrollProgress = useRef(0);
  const scrollable = useRef(false);
  const lastScroll = useRef(performance.now());
  const velocity = useRef(0);
  const [caOffset] = useState(() => new THREE.Vector2(0, 0));

  // Pilotage du morphing cale sur les sections. On lit la position reelle de
  // chaque section pour construire une table d'ancrages (scrollY -> uProgress)
  // puis on interpole lineairement par morceaux. Ainsi chaque formation est
  // pleinement formee quand sa section est centree dans le viewport.
  const progressFn = useRef<(y: number) => number>(() => 0);
  useEffect(() => {
    // Recalcule la table d'ancrages (dependante de la mise en page / fonts).
    const rebuild = () => {
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      scrollable.current = max > 240;

      const anchors: Array<{ y: number; p: number }> = [];
      for (const kf of SECTION_KEYFRAMES) {
        const el = document.getElementById(kf.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const center = rect.top + window.scrollY + rect.height / 2;
        // scrollY pour lequel le centre de la section est au centre du viewport.
        const y = Math.max(0, Math.min(max, center - vh / 2));
        anchors.push({ y, p: kf.p });
      }
      anchors.sort((a, b) => a.y - b.y);

      progressFn.current = (y: number) => {
        if (anchors.length === 0) return 0;
        if (y <= anchors[0].y) return anchors[0].p;
        const lastA = anchors[anchors.length - 1];
        if (y >= lastA.y) return lastA.p;
        for (let i = 0; i < anchors.length - 1; i++) {
          const a = anchors[i];
          const b = anchors[i + 1];
          if (y >= a.y && y <= b.y) {
            const span = b.y - a.y;
            const t = span > 0 ? (y - a.y) / span : 0;
            return a.p + (b.p - a.p) * t;
          }
        }
        return lastA.p;
      };

      scrollProgress.current = progressFn.current(window.scrollY);
      lastScroll.current = performance.now();
    };

    const onScroll = () => {
      scrollProgress.current = progressFn.current(window.scrollY);
      lastScroll.current = performance.now();
    };

    rebuild();
    // La hauteur des sections se stabilise apres le chargement (fonts, images).
    const t1 = setTimeout(rebuild, 400);
    const t2 = setTimeout(rebuild, 1500);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", rebuild);
    // La hauteur de page change aussi quand le contenu change (filtres de la
    // grille projets, modale...) : on re-ancre les formations a chaque
    // changement de taille du body, sinon le morphing se decale des sections.
    const ro = new ResizeObserver(() => rebuild());
    ro.observe(document.body);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", rebuild);
      ro.disconnect();
    };
  }, []);

  if (!webgl) return <FieldFallback />;

  return (
    <div className="pointer-events-none fixed inset-0 -z-0">
      <Canvas
        camera={{ position: [0, 0, 14], fov: 55 }}
        // dpr borne a 1.5 : reduit fortement le cout fragment / bloom.
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        // Rendu a la demande : c'est RenderDriver qui cadence les frames.
        frameloop="demand"
      >
        <Particles
          reduced={reduced}
          count={count}
          scrollProgress={scrollProgress}
          scrollable={scrollable}
          lastScroll={lastScroll}
          velocity={velocity}
        />
        <RenderDriver reduced={reduced} lastScroll={lastScroll} />
        {/* Post-processing : bloom (glow), aberration chromatique cinetique
            (uniquement pendant les transitions rapides) et vignette douce.
            Desactive sur moteur logiciel. */}
        {enableFx && (
          <>
            <AberrationDriver velocity={velocity} offset={caOffset} />
            <EffectComposer>
              <Bloom
                intensity={0.55}
                luminanceThreshold={0.18}
                luminanceSmoothing={0.3}
                radius={0.6}
                mipmapBlur
              />
              <ChromaticAberration offset={caOffset} />
              <Vignette offset={0.24} darkness={0.55} />
            </EffectComposer>
          </>
        )}
      </Canvas>
    </div>
  );
}
