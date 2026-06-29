// Utilitaires bas niveau pour la couche 3D : detection du support WebGL et
// choix du nombre de particules selon le type d'appareil (perfs).

/** Teste si un contexte WebGL est disponible (sinon on affiche un fallback). */
export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

/** Vrai si on est sur un petit ecran (mobile / tablette etroite). */
export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

/**
 * Detecte un rendu logiciel ou de secours (SwiftShader, llvmpipe, Mesa
 * software, basic render Windows). Sur ces moteurs, le bloom et un grand
 * nombre de particules sont trop couteux : on degrade pour rester fluide.
 */
export function isSoftwareRenderer(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return true;
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
      : "";
    return /swiftshader|software|llvmpipe|basic render|microsoft basic|mesa/i.test(
      renderer
    );
  } catch {
    return false;
  }
}

/**
 * Nombre de particules cible. Volontairement mesure pour limiter l'overdraw
 * additif (principal cout GPU) tout en gardant une nuee dense : 30000 desktop,
 * 10000 mobile. Le rendu reste riche grace au bloom.
 */
export function getParticleCount(): number {
  return isMobileViewport() ? 10000 : 30000;
}

/** Pixel ratio borne a 2 (regle de perf du brief : dpr max 2). */
export function cappedPixelRatio(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
}
