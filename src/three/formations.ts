// Generation des positions cibles de chaque formation du champ de particules.
// Fil narratif : chaque formation ILLUSTRE la section qu'elle accompagne.
//   0. Logo "{ EPITECH }"  -> Hero      (identite, conserve)
//   1. Portrait            -> A propos  (echantillonnage de la photo)
//   2. Reseau en grappes   -> Skills    (5 grappes = 5 domaines de competences)
//   3. Frise ascendante    -> Parcours  (jalons relies, trajectoire qui monte)
//   4. Mur de cartes       -> Projets   (grille de cartes, comme la section)
//   5. Glyphe "@"          -> Contact   (l'invitation a ecrire)
// La dispersion (scatter) sert de matiere de transition : les morphs "eclatent"
// a travers elle (detour dans le vertex shader) + assemblage a l'arrivee.

export interface Formations {
  logo: Float32Array;
  scatter: Float32Array;
  portrait: Float32Array;
  network: Float32Array;
  timeline: Float32Array;
  cards: Float32Array;
  contact: Float32Array;
  seeds: Float32Array;
}

/* ==========================================================================
   OUTILS : echantillonnage de texte / glyphes sur canvas
   ========================================================================== */

interface TextPart {
  text: string;
  size: number;
}

// Dessine une suite de fragments de texte (tailles independantes) centree sur
// un canvas, et renvoie le canvas. Utilise pour le logo, le "@" et le "FH.".
function drawTextCanvas(
  parts: TextPart[],
  W = 1600,
  H = 640
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  const gap = Math.min(...parts.map((p) => p.size)) * 0.32;
  const widths = parts.map((p) => {
    ctx.font = `${p.size}px Anton, "Arial Black", sans-serif`;
    return ctx.measureText(p.text).width;
  });
  const total =
    widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);

  let x = (W - total) / 2;
  const cy = H / 2;
  parts.forEach((p, i) => {
    ctx.font = `${p.size}px Anton, "Arial Black", sans-serif`;
    ctx.fillText(p.text, x, cy);
    x += widths[i] + gap;
  });
  return canvas;
}

// Extrait les pixels "allumes" (alpha > 128) d'un canvas, pas de 2px.
function sampleLitPixels(canvas: HTMLCanvasElement): number[] {
  const ctx = canvas.getContext("2d")!;
  const { width: W, height: H } = canvas;
  const data = ctx.getImageData(0, 0, W, H).data;
  const lit: number[] = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) lit.push(x, y);
    }
  }
  return lit;
}

/* ==========================================================================
   MISE EN PAGE / ORIENTATION DES GLYPHES
   ========================================================================== */

// Orientation "en biais" du logo (rotation 3D), partagee avec le calcul de mise
// en page responsive.
export const LOGO_TILT_Y = -0.42; // ~ -24deg (perspective)
const LOGO_TILT_Z = -0.06; // leger tilt

export interface GlyphLayout {
  worldWidth: number;
  offsetX: number;
  offsetY: number;
  tiltY?: number;
  tiltZ?: number;
}

const DEFAULT_LOGO_LAYOUT: GlyphLayout = {
  worldWidth: 15,
  offsetX: 3.6,
  offsetY: 0.4,
  tiltY: LOGO_TILT_Y,
  tiltZ: LOGO_TILT_Z,
};

/**
 * Mise en page responsive du logo : largeur proportionnelle a la zone visible
 * (memes proportions sur tous les ecrans) et decalage a droite calcule pour
 * coller le bord droit pres du bord de l'ecran. vw / vh = dimensions visibles
 * en unites monde (R3F viewport) au plan du logo.
 */
export function computeLogoLayout(vw: number, vh: number): GlyphLayout {
  // Ecrans etroits / portrait (telephones) : le logo passe en haut, centre,
  // comme un filigrane de marque dans l'espace libre au-dessus du texte.
  if (vw < 9) {
    return {
      worldWidth: Math.min(vw * 0.9, 16),
      offsetX: 0,
      offsetY: Math.min(vh * 0.28, 6),
      tiltY: LOGO_TILT_Y,
      tiltZ: LOGO_TILT_Z,
    };
  }
  // Paysage : logo a droite, largeur ~50% de la zone visible (proportions
  // constantes), bord droit colle pres du bord de l'ecran.
  const worldWidth = Math.min(Math.max(vw * 0.5, 6), 20);
  const projHalf = (worldWidth / 2) * Math.cos(LOGO_TILT_Y);
  let offsetX = vw / 2 - 0.6 - projHalf;
  // Jamais a gauche du centre (le texte du hero occupe la gauche).
  offsetX = Math.max(offsetX, vw * 0.05);
  const offsetY = Math.min(vh * 0.03, 0.5);
  return { worldWidth, offsetX, offsetY, tiltY: LOGO_TILT_Y, tiltZ: LOGO_TILT_Z };
}

/** Mise en page du "@" de la section contact : grand, legerement a droite. */
export function computeContactLayout(vw: number, vh: number): GlyphLayout {
  if (vw < 9) {
    return {
      worldWidth: Math.min(vw * 0.7, 8),
      offsetX: 0,
      offsetY: Math.min(vh * 0.18, 3.4),
      tiltY: -0.12,
      tiltZ: 0.04,
    };
  }
  return {
    worldWidth: Math.min(Math.max(vw * 0.26, 5), 9.5),
    offsetX: vw * 0.24,
    offsetY: 0.2,
    tiltY: -0.18,
    tiltZ: 0.05,
  };
}

/** Mise en page du portrait (section "A propos") : a droite du contenu. */
export function computePortraitLayout(vw: number, vh: number): GlyphLayout {
  if (vw < 9) {
    return {
      worldWidth: Math.min(vw * 0.75, 7),
      offsetX: 0,
      offsetY: Math.min(vh * 0.16, 3),
      tiltY: -0.1,
    };
  }
  return {
    worldWidth: Math.min(Math.max(vw * 0.22, 4.5), 7.5),
    offsetX: vw * 0.26,
    offsetY: 0.3,
    tiltY: -0.16,
  };
}

// Projette une liste de points 2D (pixels) vers l'espace monde, avec rotation
// (tilt Z puis Y) et decalage. Partage par tous les glyphes.
function projectPixels(
  count: number,
  lit: number[],
  W: number,
  H: number,
  layout: GlyphLayout,
  out: Float32Array,
  depthJitter = 0.35
): void {
  const scale = layout.worldWidth / W;
  const tiltY = layout.tiltY ?? 0;
  const tiltZ = layout.tiltZ ?? 0;
  const cosY = Math.cos(tiltY);
  const sinY = Math.sin(tiltY);
  const cosZ = Math.cos(tiltZ);
  const sinZ = Math.sin(tiltZ);
  const pointCount = lit.length / 2;

  for (let i = 0; i < count; i++) {
    const idx = ((Math.random() * pointCount) | 0) * 2;
    let lx = (lit[idx] - W / 2) * scale + (Math.random() - 0.5) * 0.04;
    let ly = -(lit[idx + 1] - H / 2) * scale + (Math.random() - 0.5) * 0.04;
    const lz = (Math.random() - 0.5) * depthJitter;

    const rx = lx * cosZ - ly * sinZ;
    const ry = lx * sinZ + ly * cosZ;
    lx = rx;
    ly = ry;
    const fx = lx * cosY + lz * sinY;
    const fz = -lx * sinY + lz * cosY;

    out[i * 3] = fx + layout.offsetX;
    out[i * 3 + 1] = ly + layout.offsetY;
    out[i * 3 + 2] = fz;
  }
}

/** Place `count` particules sur les pixels d'un texte (Anton). */
export function buildGlyphPositions(
  count: number,
  fallback: Float32Array,
  parts: TextPart[],
  layout: GlyphLayout
): Float32Array {
  const out = new Float32Array(count * 3);
  const canvas = drawTextCanvas(parts);
  if (!canvas) {
    out.set(fallback.subarray(0, count * 3));
    return out;
  }
  const lit = sampleLitPixels(canvas);
  if (lit.length === 0) {
    out.set(fallback.subarray(0, count * 3));
    return out;
  }
  projectPixels(count, lit, canvas.width, canvas.height, layout, out);
  return out;
}

// Echantillonne le logo "{ EPITECH }" (identite de marque, conservee au hero).
export function buildLogoPositions(
  count: number,
  fallback: Float32Array,
  layout: GlyphLayout = DEFAULT_LOGO_LAYOUT
): Float32Array {
  return buildGlyphPositions(
    count,
    fallback,
    [
      { text: "{", size: 390 },
      { text: "EPITECH", size: 230 },
      { text: "}", size: 390 },
    ],
    layout
  );
}

/** Le "@" geant de la section contact. */
export function buildContactPositions(
  count: number,
  fallback: Float32Array,
  layout: GlyphLayout
): Float32Array {
  return buildGlyphPositions(count, fallback, [{ text: "@", size: 470 }], {
    ...layout,
  });
}

/**
 * Portrait en particules : echantillonne la photo (luminance) et place les
 * particules sur les zones claires, densite et profondeur proportionnelles a
 * la luminosite (les zones lumineuses "sortent" vers la camera : relief).
 * Renvoie null si l'image ne peut pas etre chargee (le caller retombe sur un
 * monogramme "FH.").
 */
export function buildPortraitPositions(
  count: number,
  src: string,
  layout: GlyphLayout
): Promise<Float32Array | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const W = 180;
        const H = Math.round((W * img.naturalHeight) / img.naturalWidth) || 220;
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, W, H);
        const data = ctx.getImageData(0, 0, W, H).data;

        // Luminances normalisees (contraste etire sur [min, max]).
        const lum = new Float32Array(W * H);
        let lo = 1;
        let hi = 0;
        for (let i = 0; i < W * H; i++) {
          const l =
            (0.2126 * data[i * 4] +
              0.7152 * data[i * 4 + 1] +
              0.0722 * data[i * 4 + 2]) /
            255;
          lum[i] = l;
          if (l < lo) lo = l;
          if (l > hi) hi = l;
        }
        const range = Math.max(hi - lo, 0.001);

        // Echantillonnage pondere : probabilite ~ luminance^2 (les zones
        // claires recoivent plus de particules -> le visage se dessine).
        const cdf = new Float32Array(W * H);
        let acc = 0;
        for (let i = 0; i < W * H; i++) {
          const l = (lum[i] - lo) / range;
          acc += l * l;
          cdf[i] = acc;
        }
        if (acc <= 0) return resolve(null);

        const out = new Float32Array(count * 3);
        const scale = layout.worldWidth / W;
        const tiltY = layout.tiltY ?? 0;
        const cosY = Math.cos(tiltY);
        const sinY = Math.sin(tiltY);

        for (let i = 0; i < count; i++) {
          // Recherche binaire dans la CDF.
          const r = Math.random() * acc;
          let a = 0;
          let b = W * H - 1;
          while (a < b) {
            const m = (a + b) >> 1;
            if (cdf[m] < r) a = m + 1;
            else b = m;
          }
          const px = a % W;
          const py = (a / W) | 0;
          const l = (lum[a] - lo) / range;

          let lx = (px - W / 2) * scale + (Math.random() - 0.5) * 0.05;
          const ly =
            -(py - H / 2) * scale + (Math.random() - 0.5) * 0.05;
          // Relief : les zones claires avancent vers la camera.
          const lz = (l - 0.35) * 1.1 + (Math.random() - 0.5) * 0.18;

          const fx = lx * cosY + lz * sinY;
          const fz = -lx * sinY + lz * cosY;
          lx = fx;

          out[i * 3] = lx + layout.offsetX;
          out[i * 3 + 1] = ly + layout.offsetY;
          out[i * 3 + 2] = fz;
        }
        resolve(out);
      } catch {
        // Canvas "taint" (CORS) ou autre erreur : fallback.
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* ==========================================================================
   FORMATIONS GEOMETRIQUES
   ========================================================================== */

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Bruit pseudo gaussien (somme d'uniformes) pour des amas doux et naturels.
function gaussian(scale: number): number {
  return (Math.random() + Math.random() - 1) * scale;
}

export function generateFormations(count: number): Formations {
  const scatter = new Float32Array(count * 3);
  const portrait = new Float32Array(count * 3);
  const network = new Float32Array(count * 3);
  const timeline = new Float32Array(count * 3);
  const cards = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  // --- Dispersion : coquille spherique epaisse et desordonnee (transitions) ---
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 4.2 + (Math.random() - 0.5) * 4.4;
    const sp = Math.sin(phi);
    scatter[i * 3] = r * sp * Math.cos(theta) + gaussian(0.5);
    scatter[i * 3 + 1] = r * sp * Math.sin(theta) * 0.85 + gaussian(0.5);
    scatter[i * 3 + 2] = r * Math.cos(phi) + gaussian(0.5);
    seeds[i] = Math.random();
  }

  // Portrait : initialise sur la dispersion ; remplace des que la photo est
  // echantillonnee (ou par le monogramme "FH." si elle echoue). Voir
  // ParticleField, qui pilote ce chargement asynchrone.
  portrait.set(scatter);

  // --- Reseau en GRAPPES : 5 grappes = les 5 domaines de la section Skills ---
  // (Systems, Frontend, Backend, DevOps, Data). Chaque grappe est un amas de
  // noeuds interconnectes ; quelques longues aretes relient les grappes.
  const CLUSTERS = 5;
  const NODES_PER_CLUSTER = 13;
  const nodes: Array<[number, number, number]> = [];
  const clusterOf: number[] = [];
  for (let c = 0; c < CLUSTERS; c++) {
    const ang = (c / CLUSTERS) * Math.PI * 2 + 0.5;
    const cx = Math.cos(ang) * 4.6;
    const cy = Math.sin(ang) * 2.9;
    const cz = rand(-1.6, 1.6);
    for (let n = 0; n < NODES_PER_CLUSTER; n++) {
      nodes.push([cx + gaussian(1.25), cy + gaussian(1.0), cz + gaussian(1.1)]);
      clusterOf.push(c);
    }
  }
  const edges: Array<[number, number]> = [];
  // Aretes intra-grappe : chaque noeud relie a ses 2 plus proches voisins de
  // la meme grappe.
  for (let a = 0; a < nodes.length; a++) {
    const dists: Array<[number, number]> = [];
    for (let b = 0; b < nodes.length; b++) {
      if (b === a || clusterOf[b] !== clusterOf[a]) continue;
      const dx = nodes[a][0] - nodes[b][0];
      const dy = nodes[a][1] - nodes[b][1];
      const dz = nodes[a][2] - nodes[b][2];
      dists.push([dx * dx + dy * dy + dz * dz, b]);
    }
    dists.sort((p, q) => p[0] - q[0]);
    if (dists[0]) edges.push([a, dists[0][1]]);
    if (dists[1]) edges.push([a, dists[1][1]]);
  }
  // Quelques dorsales inter-grappes (le "stack" est un tout connecte).
  for (let c = 0; c < CLUSTERS; c++) {
    const a = c * NODES_PER_CLUSTER + ((Math.random() * NODES_PER_CLUSTER) | 0);
    const nc = (c + 1) % CLUSTERS;
    const b = nc * NODES_PER_CLUSTER + ((Math.random() * NODES_PER_CLUSTER) | 0);
    edges.push([a, b], [a, b]); // doublee : un peu plus dense
  }
  for (let i = 0; i < count; i++) {
    if (i % 5 < 2) {
      const node = nodes[i % nodes.length];
      network[i * 3] = node[0] + gaussian(0.3);
      network[i * 3 + 1] = node[1] + gaussian(0.3);
      network[i * 3 + 2] = node[2] + gaussian(0.3);
    } else {
      const e = edges[i % edges.length];
      const A = nodes[e[0]];
      const B = nodes[e[1]];
      const t = Math.random();
      network[i * 3] = A[0] + (B[0] - A[0]) * t + gaussian(0.09);
      network[i * 3 + 1] = A[1] + (B[1] - A[1]) * t + gaussian(0.09);
      network[i * 3 + 2] = A[2] + (B[2] - A[2]) * t + gaussian(0.09);
    }
  }

  // --- Frise ascendante : la trajectoire du Parcours ---
  // Une ligne qui monte de gauche a droite, ponctuee de jalons (amas denses),
  // echo direct de la frise verticale affichee dans la section.
  const MILESTONES = 6;
  const start: [number, number, number] = [-7.6, -3.6, 0];
  const end: [number, number, number] = [7.6, 3.6, 0];
  const ms: Array<[number, number, number]> = [];
  for (let m = 0; m < MILESTONES; m++) {
    const t = m / (MILESTONES - 1);
    ms.push([
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t + Math.sin(t * Math.PI * 2.2) * 0.7,
      Math.sin(t * Math.PI * 1.4) * 1.2,
    ]);
  }
  for (let i = 0; i < count; i++) {
    const roll = i % 10;
    if (roll < 5) {
      // Jalons : amas lumineux (comme les pastilles de la frise).
      const m = ms[i % MILESTONES];
      timeline[i * 3] = m[0] + gaussian(0.42);
      timeline[i * 3 + 1] = m[1] + gaussian(0.42);
      timeline[i * 3 + 2] = m[2] + gaussian(0.42);
    } else {
      // Le fil : points serres le long de la ligne brisee entre jalons.
      const segIdx = i % (MILESTONES - 1);
      const A = ms[segIdx];
      const B = ms[segIdx + 1];
      const t = Math.random();
      timeline[i * 3] = A[0] + (B[0] - A[0]) * t + gaussian(0.07);
      timeline[i * 3 + 1] = A[1] + (B[1] - A[1]) * t + gaussian(0.07);
      timeline[i * 3 + 2] = A[2] + (B[2] - A[2]) * t + gaussian(0.07);
    }
  }

  // --- Mur de cartes : la grille de Projets ---
  // 4 x 3 cartes rectangulaires (contour dense + interieur clairseme), comme
  // la grille de cartes affichee dans la section.
  const COLS = 4;
  const ROWS = 3;
  const CW = 2.7;
  const CH = 1.75;
  const GAP = 0.55;
  const totalW = COLS * CW + (COLS - 1) * GAP;
  const totalH = ROWS * CH + (ROWS - 1) * GAP;
  const cardZ: number[] = [];
  for (let c = 0; c < COLS * ROWS; c++) cardZ.push(rand(-0.5, 0.5));
  for (let i = 0; i < count; i++) {
    const card = i % (COLS * ROWS);
    const col = card % COLS;
    const row = (card / COLS) | 0;
    const x0 = -totalW / 2 + col * (CW + GAP);
    const y0 = totalH / 2 - row * (CH + GAP);

    let px: number;
    let py: number;
    if (i % 10 < 7) {
      // Contour de la carte (70%) : la carte se "dessine".
      const p = Math.random() * 2 * (CW + CH);
      if (p < CW) {
        px = x0 + p;
        py = y0;
      } else if (p < CW + CH) {
        px = x0 + CW;
        py = y0 - (p - CW);
      } else if (p < 2 * CW + CH) {
        px = x0 + (p - CW - CH);
        py = y0 - CH;
      } else {
        px = x0;
        py = y0 - (p - 2 * CW - CH);
      }
      px += gaussian(0.05);
      py += gaussian(0.05);
    } else {
      // Interieur clairseme (30%) : matiere de la carte.
      px = x0 + Math.random() * CW;
      py = y0 - Math.random() * CH;
    }
    cards[i * 3] = px;
    cards[i * 3 + 1] = py;
    cards[i * 3 + 2] = cardZ[card] + gaussian(0.12);
  }

  // --- Logo "{ EPITECH }" (hero) et "@" (contact) : echantillonnage initial.
  // La police Anton n'est peut-etre pas encore prete ; ParticleField
  // re-echantillonne les deux une fois la police chargee.
  const logo = buildLogoPositions(count, scatter);
  const contact = buildContactPositions(count, scatter, {
    worldWidth: 8,
    offsetX: 3,
    offsetY: 0.2,
    tiltY: -0.18,
    tiltZ: 0.05,
  });

  return { logo, scatter, portrait, network, timeline, cards, contact, seeds };
}
