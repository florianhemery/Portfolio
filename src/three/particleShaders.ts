// Shaders GLSL du champ de particules.
// Vertex : morphing entre 4 formations (uProgress) + curl noise organique.
// Fragment : point rond lumineux, teinte violette dominante variant selon la
// profondeur et la vitesse de morphing (relief).

// Bruit simplex 3D (Ashima Arts / Stefan Gustavson, domaine public) utilise
// pour generer un curl noise (mouvement permanent sans divergence).
const glslSimplexNoise = /* glsl */ `
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // Deplacement organique a base de simplex (3 evaluations par particule).
  // Approximation legere d'un curl noise : mouvement tourbillonnant continu,
  // bien plus performant que le vrai curl (qui demande ~18 evaluations).
  vec3 organicNoise(vec3 x) {
    return vec3(
      snoise(x),
      snoise(x + vec3(123.4, 56.7, 89.0)),
      snoise(x + vec3(-12.3, 98.7, 43.2))
    );
  }
`;

export const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uReduced;  // 1.0 si l'utilisateur a reduit les animations
  uniform float uProgress; // 0..1 : progression dans l'enchainement des formations

  // position = dispersion. Les autres formations sont des attributs.
  attribute vec3 aLogo;      // formation 0 : logo "{ EPITECH }" (depart)
  attribute vec3 aNetwork;   // formation 2 : reseau de noeuds
  attribute vec3 aFlow;      // formation 3 : flux / pipeline
  attribute vec3 aStructure; // formation 4 : structure ordonnee
  attribute float aSeed;     // graine aleatoire par particule (0..1)

  varying float vDepth;
  varying float vSeed;

  ${glslSimplexNoise}

  // Interpole entre les 5 formations selon uProgress (4 segments egaux) :
  // logo -> dispersion -> reseau -> flux -> structure. Lissage par smoothstep.
  vec3 morph(vec3 scatter) {
    float seg = clamp(uProgress, 0.0, 1.0) * 4.0;
    vec3 a;
    vec3 b;
    float lt;
    if (seg < 1.0) {
      a = aLogo; b = scatter; lt = seg;
    } else if (seg < 2.0) {
      a = scatter; b = aNetwork; lt = seg - 1.0;
    } else if (seg < 3.0) {
      a = aNetwork; b = aFlow; lt = seg - 2.0;
    } else {
      a = aFlow; b = aStructure; lt = seg - 3.0;
    }
    lt = smoothstep(0.0, 1.0, clamp(lt, 0.0, 1.0));
    return mix(a, b, lt);
  }

  void main() {
    vec3 p = morph(position);

    // Curl noise permanent, attenue pres du logo (depart) et de la structure
    // finale (ces formations doivent rester nettes), coupe en reduced motion.
    float structureWeight = smoothstep(0.78, 1.0, uProgress);
    float logoWeight = smoothstep(0.12, 0.0, uProgress);
    float move = (1.0 - uReduced)
      * (1.0 - structureWeight * 0.9)
      * (1.0 - logoWeight * 0.92);
    vec3 flow = organicNoise(p * 0.22 + vec3(0.0, 0.0, uTime * 0.06));
    p += flow * 0.3 * move;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    vSeed = aSeed;

    // Taille en perspective : les points proches sont plus gros.
    gl_PointSize = uSize * uPixelRatio * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const particleFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColorA;    // violet accent (identite)
  uniform vec3 uColorB;    // froid (indigo / cyan) pour le relief
  uniform float uVelocity; // vitesse globale de morphing (0..1 apres lissage)

  varying float vDepth;
  varying float vSeed;

  void main() {
    // Point rond : on jette tout ce qui sort du cercle.
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    // Falloff doux du centre vers le bord -> halo (rendu additif).
    float alpha = smoothstep(0.5, 0.0, d);

    // Teinte : violet dominant, derive froide selon la profondeur, la graine
    // et la vitesse (les particules en transition rapide tirent vers le froid).
    float vel = clamp(uVelocity, 0.0, 1.0);
    float t = clamp((vDepth - 9.0) / 20.0, 0.0, 1.0);
    vec3 col = mix(uColorA, uColorB, t * 0.32 + vSeed * 0.06 + vel * 0.22);

    // Leger surcroit de luminosite avec la vitesse (le bloom s'en empare).
    col *= 1.0 + vel * 0.25;

    // L'additif sature vite vers le bleu : on attenue l'alpha dans les zones
    // denses pour preserver la teinte violette.
    gl_FragColor = vec4(col, alpha * 0.6);
  }
`;
