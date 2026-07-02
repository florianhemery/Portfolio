// Shaders GLSL du champ de particules.
// Vertex : morphing entre 6 formations (uProgress) avec "detour" par la
// dispersion au milieu de chaque transition (la nuee eclate puis se reforme),
// + curl noise organique attenue quand une formation est nettement formee.
// Fragment : point rond lumineux, teinte pilotee par les uniforms de couleur
// (elles glissent selon la section visible), relief par profondeur/vitesse.

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
  uniform float uIntro;    // 1 -> 0 au chargement : la nuee s'assemble depuis le chaos

  // position = dispersion (matiere de transition). Formations en attributs :
  attribute vec3 aLogo;     // 0.0 : logo "{ EPITECH }"  (hero)
  attribute vec3 aPortrait; // 0.2 : portrait photo      (a propos)
  attribute vec3 aNetwork;  // 0.4 : reseau en grappes   (competences)
  attribute vec3 aTimeline; // 0.6 : frise ascendante    (parcours)
  attribute vec3 aCards;    // 0.8 : mur de cartes       (projets)
  attribute vec3 aContact;  // 1.0 : glyphe "@"          (contact)
  attribute float aSeed;    // graine aleatoire par particule (0..1)

  varying float vDepth;
  varying float vSeed;

  ${glslSimplexNoise}

  // Interpole entre les 6 formations selon uProgress (5 segments egaux), avec
  // un detour par la dispersion au coeur de chaque transition : la nuee
  // "explose" puis se recompose en formation suivante.
  vec3 morph(vec3 scatter, out float formed) {
    float seg = clamp(uProgress, 0.0, 1.0) * 5.0;
    vec3 a; vec3 b; float lt;
    if (seg < 1.0)      { a = aLogo;     b = aPortrait; lt = seg; }
    else if (seg < 2.0) { a = aPortrait; b = aNetwork;  lt = seg - 1.0; }
    else if (seg < 3.0) { a = aNetwork;  b = aTimeline; lt = seg - 2.0; }
    else if (seg < 4.0) { a = aTimeline; b = aCards;    lt = seg - 3.0; }
    else                { a = aCards;    b = aContact;  lt = seg - 4.0; }
    lt = clamp(lt, 0.0, 1.0);
    float smoothLt = smoothstep(0.0, 1.0, lt);
    vec3 pos = mix(a, b, smoothLt);

    // Detour par le chaos : nul aux extremites (formations nettes), maximal
    // au milieu de la transition. Ecarte legerement selon la graine pour un
    // eclatement irregulier, plus organique.
    float burst = sin(3.14159265 * lt);
    pos = mix(pos, scatter, burst * (0.3 + aSeed * 0.15));

    // "formed" = 1 pile sur une formation, 0 en pleine transition.
    formed = 1.0 - burst;
    return pos;
  }

  void main() {
    float formed;
    vec3 p = morph(position, formed);

    // Assemblage d'intro : au chargement la nuee arrive du chaos vers le logo.
    p = mix(p, position, uIntro);

    // Curl noise permanent : discret quand une formation est formee (elle doit
    // rester lisible : logo, portrait, "@"...), ample en pleine transition.
    float seg = clamp(uProgress, 0.0, 1.0) * 5.0;
    float idx = floor(seg + 0.5);
    // Formations "typographiques" (logo, portrait, @) : quasi immobiles.
    float isText = (idx < 1.5 || idx > 4.5) ? 1.0 : 0.0;
    float rest = mix(0.16, 0.05, isText);
    float move = (1.0 - uReduced) * mix(1.0, rest, formed);
    move = max(move, uIntro * (1.0 - uReduced)); // l'intro reste vivante
    vec3 flow = organicNoise(p * 0.22 + vec3(0.0, 0.0, uTime * 0.06));
    p += flow * 0.32 * move;

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

  uniform vec3 uColorA;    // accent de la section courante (identite)
  uniform vec3 uColorB;    // teinte claire associee (relief)
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

    // Teinte : accent dominant, derive claire selon la profondeur, la graine
    // et la vitesse (les particules en transition rapide tirent vers le clair).
    float vel = clamp(uVelocity, 0.0, 1.0);
    float t = clamp((vDepth - 9.0) / 20.0, 0.0, 1.0);
    vec3 col = mix(uColorA, uColorB, t * 0.32 + vSeed * 0.06 + vel * 0.22);

    // Leger surcroit de luminosite avec la vitesse (le bloom s'en empare).
    col *= 1.0 + vel * 0.25;

    // L'additif sature vite : on attenue l'alpha dans les zones denses pour
    // preserver la teinte.
    gl_FragColor = vec4(col, alpha * 0.6);
  }
`;
