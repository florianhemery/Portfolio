import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";

import {
  particleFragmentShader,
  particleVertexShader,
} from "./particleShaders";
import {
  buildLogoPositions,
  computeLogoLayout,
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
const REDUCED_PROGRESS = 0.34;

// Calage des formations sur les sections : chaque section vise une valeur de
// uProgress (0 logo, 0.25 dispersion, 0.5 reseau, 0.75 flux, 1 structure). La
// formation se forme quand la section est centree dans le viewport, et morphe
// en douceur entre deux sections. Themes : Hero=marque, About=curiosite/chaos,
// Skills=reseau de competences, Parcours=flux, Projets+suite=structure (resultat).
const SECTION_KEYFRAMES: Array<{ id: string; p: number }> = [
  { id: "hero", p: 0.0 },
  { id: "about", p: 0.25 },
  { id: "skills", p: 0.5 },
  { id: "timeline", p: 0.75 },
  { id: "projects", p: 1.0 },
  { id: "stats", p: 1.0 },
  { id: "testimonials", p: 1.0 },
  { id: "contact", p: 1.0 },
];

interface SharedRefs {
  // Progression de scroll cible (0..1) et indicateur "la page est scrollable".
  scrollProgress: React.RefObject<number>;
  scrollable: React.RefObject<boolean>;
  // Horodatage de la derniere interaction de scroll (pilotage du framerate).
  lastScroll: React.RefObject<number>;
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
}: ParticlesProps) {
  const groupRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Override manuel de uProgress (outil de debug en dev : window.__setProgress).
  // null => pilotage par le scroll (ou demo automatique si page trop courte).
  const manualProgress = useRef<number | null>(null);

  const { logo, scatter, network, flow, structure, seeds } = useMemo(
    () => generateFormations(count),
    [count]
  );

  // Accumulateur de rotation : la rotation s'efface pres du logo (en haut) pour
  // qu'il reste face camera et lisible, puis s'installe en scrollant.
  const spin = useRef(0);

  // Uniforms crees une seule fois ; on met a jour uTime / uProgress dans la boucle.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 34 }, // points compacts : limite l'overdraw additif
      uPixelRatio: { value: cappedPixelRatio() },
      uReduced: { value: reduced ? 1 : 0 },
      // On part legerement de la dispersion pour que la nuee "s'assemble" en
      // logo au chargement (la cible au repos en haut de page est 0 = logo).
      uProgress: { value: reduced ? REDUCED_PROGRESS : 0.22 },
      uVelocity: { value: 0 },
      uColorA: { value: new THREE.Color("#1f3cff") }, // bleu Epitech (identite)
      uColorB: { value: new THREE.Color("#5ec8ff") }, // bleu clair (relief)
    }),
    // `reduced` ne change pas en cours de session ; capture initiale suffisante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Re-echantillonne le logo : une fois la police Anton chargee, et a chaque
  // changement de taille d'ecran (mise en page responsive du logo). Met a jour
  // l'attribut aLogo en place. Debounce pour absorber les resize continus.
  const invalidate = useThree((s) => s.invalidate);
  // On selectionne des primitives (pas l'objet viewport) pour eviter tout
  // re-render superflu lors des redimensionnements.
  const vw = useThree((s) => s.viewport.width);
  const vh = useThree((s) => s.viewport.height);
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
        const layout = computeLogoLayout(vw, vh);
        const arr = buildLogoPositions(count, scatter, layout);
        const attr = groupRef.current?.geometry.getAttribute("aLogo") as
          | THREE.BufferAttribute
          | undefined;
        if (attr) {
          (attr.array as Float32Array).set(arr);
          attr.needsUpdate = true;
          invalidate();
        }
      })();
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [count, scatter, vw, vh, invalidate]);

  // Outil de debug (dev uniquement) : permet de figer une formation precise
  // depuis la console. window.__setProgress(0.66) ou window.__setProgress(null).
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
      // Formation statique : rien ne bouge.
      mat.uniforms.uProgress.value = REDUCED_PROGRESS;
      return;
    }

    // delta peut etre grand quand le rendu a ete mis en pause : on le borne
    // pour eviter tout saut a la reprise.
    const dt = Math.min(delta, 0.05);
    mat.uniforms.uTime.value += dt;

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

    // Vitesse de morphing (lissee) : alimente la teinte par la vitesse.
    const instant = Math.abs(next - current) / Math.max(dt, 0.0001);
    const vel = mat.uniforms.uVelocity.value;
    mat.uniforms.uVelocity.value = vel + (instant * 1.4 - vel) * 0.12;

    // Rotation : on accumule un spin lent, mais on l'efface pres du logo
    // (uProgress proche de 0) pour le garder face camera et lisible.
    spin.current += dt * 0.04;
    if (groupRef.current) {
      let r = (next - 0.05) / 0.12;
      r = Math.max(0, Math.min(1, r));
      const reveal = r * r * (3 - 2 * r); // smoothstep
      groupRef.current.rotation.y = spin.current * reveal;
      groupRef.current.rotation.x = spin.current * 0.28 * reveal;
    }
  });

  return (
    <points ref={groupRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[scatter, 3]} />
        <bufferAttribute attach="attributes-aLogo" args={[logo, 3]} />
        <bufferAttribute attach="attributes-aNetwork" args={[network, 3]} />
        <bufferAttribute attach="attributes-aFlow" args={[flow, 3]} />
        <bufferAttribute
          attach="attributes-aStructure"
          args={[structure, 3]}
        />
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

/** Fallback sobre quand WebGL n'est pas disponible : halo radial violet. */
function FieldFallback() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-0"
      style={{
        background:
          "radial-gradient(40rem 32rem at 70% 30%, rgba(31,60,255,0.18), transparent 60%), radial-gradient(36rem 36rem at 15% 75%, rgba(94,200,255,0.08), transparent 60%)",
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
  // de particules et on coupe le bloom pour preserver la fluidite.
  const [software] = useState(() => isSoftwareRenderer());
  const count = software ? 8000 : getParticleCount();
  const enableBloom = !software;

  const scrollProgress = useRef(0);
  const scrollable = useRef(false);
  const lastScroll = useRef(performance.now());

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
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", rebuild);
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
        />
        <RenderDriver reduced={reduced} lastScroll={lastScroll} />
        {/* Bloom : le glow qui fait l'effet "waw". Intensite maitrisee, seuil
            bas et noyau reduit (KernelSize.SMALL) pour rester performant et ne
            jamais cramer en blanc. Desactive sur moteur logiciel. */}
        {enableBloom && (
          <EffectComposer>
            <Bloom
              intensity={0.55}
              luminanceThreshold={0.18}
              luminanceSmoothing={0.3}
              radius={0.6}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
