// Generation des positions cibles de chaque formation du champ de particules.
// Fil narratif (thème dev / DevOps) : du chaos vers la structure ordonnee.
//   1. Dispersion : nuee desordonnee (point de depart "brut").
//   2. Reseau     : noeuds relies par des aretes (infra, homelab, services).
//   3. Flux       : voies de donnees qui circulent (pipelines, automation).
//   4. Structure  : grille geometrique nette (code, architecture logicielle).
// Chaque jeu de positions est stocke comme attribut et interpole dans le
// vertex shader selon uProgress.

export interface Formations {
  logo: Float32Array;
  scatter: Float32Array;
  network: Float32Array;
  flow: Float32Array;
  structure: Float32Array;
  seeds: Float32Array;
}

// Dessine le logo "{ EPITECH }" sur un canvas en imitant l'identite Epitech :
// mot "EPITECH" en police Anton, encadre par deux accolades plus grandes et
// chunky (signature de la marque). Renvoie le canvas et sa boite englobante.
function drawEpitechLogo(): { canvas: HTMLCanvasElement; W: number; H: number } | null {
  if (typeof document === "undefined") return null;
  const W = 1600;
  const H = 480;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  const cy = H / 2;
  const wordSize = 230;
  const braceSize = wordSize * 1.7; // accolades nettement plus hautes (comme le logo)
  const gap = wordSize * 0.32;

  // Mesures de mise en page.
  ctx.font = `${wordSize}px Anton, "Arial Black", sans-serif`;
  const wordW = ctx.measureText("EPITECH").width;
  ctx.font = `${braceSize}px Anton, "Arial Black", sans-serif`;
  const braceW = ctx.measureText("{").width;

  const total = braceW + gap + wordW + gap + braceW;
  let x = (W - total) / 2;

  // Accolade gauche.
  ctx.font = `${braceSize}px Anton, "Arial Black", sans-serif`;
  ctx.fillText("{", x, cy);
  x += braceW + gap;
  // Mot.
  ctx.font = `${wordSize}px Anton, "Arial Black", sans-serif`;
  ctx.fillText("EPITECH", x, cy);
  x += wordW + gap;
  // Accolade droite.
  ctx.font = `${braceSize}px Anton, "Arial Black", sans-serif`;
  ctx.fillText("}", x, cy);

  return { canvas, W, H };
}

// Orientation "en biais" du logo (rotation 3D), partagee avec le calcul de mise
// en page responsive.
export const LOGO_TILT_Y = -0.42; // ~ -24deg (perspective)
const LOGO_TILT_Z = -0.06; // leger tilt

export interface LogoLayout {
  worldWidth: number;
  offsetX: number;
  offsetY: number;
}

const DEFAULT_LOGO_LAYOUT: LogoLayout = {
  worldWidth: 15,
  offsetX: 3.6,
  offsetY: 0.4,
};

/**
 * Mise en page responsive du logo : largeur proportionnelle a la zone visible
 * (memes proportions sur tous les ecrans) et decalage a droite calcule pour
 * coller le bord droit pres du bord de l'ecran. vw / vh = dimensions visibles
 * en unites monde (R3F viewport) au plan du logo.
 */
export function computeLogoLayout(vw: number, vh: number): LogoLayout {
  // Ecrans etroits / portrait (telephones) : le logo passe en haut, centre,
  // comme un filigrane de marque dans l'espace libre au-dessus du texte.
  if (vw < 9) {
    return {
      worldWidth: Math.min(vw * 0.9, 16),
      offsetX: 0,
      offsetY: Math.min(vh * 0.28, 6),
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
  return { worldWidth, offsetX, offsetY };
}

// Echantillonne le logo et place les particules sur ses pixels, en l'orientant
// "en biais" (legere rotation 3D) et decale selon la mise en page fournie.
export function buildLogoPositions(
  count: number,
  fallback: Float32Array,
  layout: LogoLayout = DEFAULT_LOGO_LAYOUT
): Float32Array {
  const logo = new Float32Array(count * 3);
  const drawn = drawEpitechLogo();
  if (!drawn) {
    logo.set(fallback);
    return logo;
  }
  const { canvas, W, H } = drawn;
  const ctx = canvas.getContext("2d")!;
  const data = ctx.getImageData(0, 0, W, H).data;

  const lit: number[] = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) lit.push(x, y);
    }
  }
  if (lit.length === 0) {
    logo.set(fallback);
    return logo;
  }

  const scale = layout.worldWidth / W;

  const cosY = Math.cos(LOGO_TILT_Y);
  const sinY = Math.sin(LOGO_TILT_Y);
  const cosZ = Math.cos(LOGO_TILT_Z);
  const sinZ = Math.sin(LOGO_TILT_Z);
  const offsetX = layout.offsetX;
  const offsetY = layout.offsetY;

  const pointCount = lit.length / 2;
  for (let i = 0; i < count; i++) {
    const idx = ((Math.random() * pointCount) | 0) * 2;
    let lx = (lit[idx] - W / 2) * scale + (Math.random() - 0.5) * 0.04;
    let ly = -(lit[idx + 1] - H / 2) * scale + (Math.random() - 0.5) * 0.04;
    let lz = (Math.random() - 0.5) * 0.35;

    // Rotation Z (tilt), puis Y (biais en profondeur).
    const rx = lx * cosZ - ly * sinZ;
    const ry = lx * sinZ + ly * cosZ;
    lx = rx;
    ly = ry;
    const fx = lx * cosY + lz * sinY;
    const fz = -lx * sinY + lz * cosY;

    logo[i * 3] = fx + offsetX;
    logo[i * 3 + 1] = ly + offsetY;
    logo[i * 3 + 2] = fz;
  }
  return logo;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Bruit pseudo gaussien (somme d'uniformes) pour des amas doux et naturels.
function gaussian(scale: number): number {
  return (Math.random() + Math.random() - 1) * scale;
}

export function generateFormations(count: number): Formations {
  const scatter = new Float32Array(count * 3);
  const network = new Float32Array(count * 3);
  const flow = new Float32Array(count * 3);
  const structure = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  // --- 1. Dispersion : coquille spherique epaisse et desordonnee ---
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

  // --- 2. Reseau / graphe : noeuds relies par des aretes ---
  const NODE_COUNT = 96;
  const nodes: Array<[number, number, number]> = [];
  for (let n = 0; n < NODE_COUNT; n++) {
    nodes.push([rand(-6, 6), rand(-4.5, 4.5), rand(-5, 5)]);
  }
  // Aretes : chaque noeud est relie a ses deux plus proches voisins.
  const edges: Array<[number, number]> = [];
  for (let a = 0; a < NODE_COUNT; a++) {
    const dists: Array<[number, number]> = [];
    for (let b = 0; b < NODE_COUNT; b++) {
      if (b === a) continue;
      const dx = nodes[a][0] - nodes[b][0];
      const dy = nodes[a][1] - nodes[b][1];
      const dz = nodes[a][2] - nodes[b][2];
      dists.push([dx * dx + dy * dy + dz * dz, b]);
    }
    dists.sort((p, q) => p[0] - q[0]);
    edges.push([a, dists[0][1]]);
    edges.push([a, dists[1][1]]);
  }
  for (let i = 0; i < count; i++) {
    if (i % 5 < 2) {
      // Amas autour d'un noeud : la densite cree un noeud lumineux.
      const node = nodes[i % NODE_COUNT];
      network[i * 3] = node[0] + gaussian(0.35);
      network[i * 3 + 1] = node[1] + gaussian(0.35);
      network[i * 3 + 2] = node[2] + gaussian(0.35);
    } else {
      // Le long d'une arete : suggere la connexion par alignement de points.
      const e = edges[i % edges.length];
      const A = nodes[e[0]];
      const B = nodes[e[1]];
      const t = Math.random();
      network[i * 3] = A[0] + (B[0] - A[0]) * t + gaussian(0.1);
      network[i * 3 + 1] = A[1] + (B[1] - A[1]) * t + gaussian(0.1);
      network[i * 3 + 2] = A[2] + (B[2] - A[2]) * t + gaussian(0.1);
    }
  }

  // --- 3. Flux / pipeline : voies horizontales ondulantes ---
  const LANES = 9;
  for (let i = 0; i < count; i++) {
    const lane = i % LANES;
    const laneY = (lane - (LANES - 1) / 2) * 1.15;
    const phase = lane * 0.7;
    const t = Math.random();
    const x = (t - 0.5) * 18;
    flow[i * 3] = x + gaussian(0.12);
    flow[i * 3 + 1] =
      laneY + Math.sin(t * Math.PI * 2 + phase) * 0.9 + gaussian(0.15);
    flow[i * 3 + 2] = Math.cos(t * Math.PI * 2 + phase) * 1.6 + gaussian(0.2);
  }

  // --- 4. Structure ordonnee : grille cubique nette ---
  const side = Math.ceil(Math.cbrt(count));
  const spacing = 11 / side;
  const half = (side - 1) / 2;
  for (let i = 0; i < count; i++) {
    const ix = i % side;
    const iy = Math.floor(i / side) % side;
    const iz = Math.floor(i / (side * side)) % side;
    structure[i * 3] = (ix - half) * spacing;
    structure[i * 3 + 1] = (iy - half) * spacing;
    structure[i * 3 + 2] = (iz - half) * spacing;
  }

  // --- 0. Logo "{ EPITECH }" (formation de depart, au chargement du hero) ---
  // Echantillonnage initial (la police Anton n'est peut-etre pas encore prete ;
  // ParticleField re-echantillonne une fois la police chargee).
  const logo = buildLogoPositions(count, scatter);

  return { logo, scatter, network, flow, structure, seeds };
}
