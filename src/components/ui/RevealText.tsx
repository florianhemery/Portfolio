import { motion, useReducedMotion } from "motion/react";

interface RevealTextProps {
  text: string;
  /** Classe(s) du conteneur (taille, police, couleur...). */
  className?: string;
  /** Delai avant le premier mot (s). */
  delay?: number;
  /** true : joue a l'entree dans le viewport ; false : pilote par le parent. */
  inView?: boolean;
}

/**
 * Revelation typographique "sous masque" : chaque mot monte depuis le bas de
 * sa propre fenetre (overflow hidden), en cascade. La signature des grands
 * titres du site. En reduced motion : simple fondu.
 */
export default function RevealText({
  text,
  className = "",
  delay = 0,
  inView = true,
}: RevealTextProps) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.055, delayChildren: delay },
    },
  };
  const word = {
    hidden: reduce ? { opacity: 0 } : { y: "115%", rotate: 4 },
    show: reduce
      ? { opacity: 1, transition: { duration: 0.3 } }
      : {
          y: "0%",
          rotate: 0,
          transition: {
            type: "spring" as const,
            stiffness: 190,
            damping: 26,
            mass: 0.9,
          },
        },
  };

  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={container}
      {...(inView
        ? {
            initial: "hidden",
            whileInView: "show",
            viewport: { once: true, margin: "-80px" },
          }
        : {})}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          aria-hidden
          className="inline-block overflow-hidden pb-[0.08em] align-bottom"
        >
          <motion.span variants={word} className="inline-block origin-bottom-left">
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
