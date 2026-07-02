interface MarqueeProps {
  /** Elements affiches en boucle (alternance rempli / contour). */
  items: string[];
  /** Duree d'un cycle complet (s) : plus court = plus rapide. */
  duration?: number;
  className?: string;
}

/**
 * Bandeau typographique defilant (Anton geant, alternance texte plein /
 * contour) : respiration graphique entre les sections. Purement decoratif
 * (aria-hidden) ; l'animation s'arrete en reduced motion (CSS).
 */
export default function Marquee({
  items,
  duration = 30,
  className = "",
}: MarqueeProps) {
  // Contenu duplique : la piste translate de -50% en boucle => defilement
  // continu sans couture.
  const half = (keyPrefix: string) => (
    <div className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={`${keyPrefix}-${i}`} className="flex items-center">
          <span
            className={`title-h2 whitespace-nowrap px-6 sm:px-10 ${
              i % 2 === 0 ? "text-fg/90" : "text-outline"
            }`}
          >
            {item}
          </span>
          <span aria-hidden className="text-accent-bright text-xl sm:text-2xl">
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      aria-hidden
      className={`relative overflow-hidden border-y border-[var(--color-line)] py-6 sm:py-8 ${className}`}
    >
      <div
        className="marquee-track"
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        {half("a")}
        {half("b")}
      </div>
      {/* Fondus lateraux pour une entree / sortie douce */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-24"
        style={{
          background: "linear-gradient(to right, var(--color-bg), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-24"
        style={{
          background: "linear-gradient(to left, var(--color-bg), transparent)",
        }}
      />
    </div>
  );
}
