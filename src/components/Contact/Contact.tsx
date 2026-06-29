import { motion } from "motion/react";
import Section from "../Section";
import { content } from "../../config/content";
import { useLang } from "../../i18n/LangContext";
import { fadeUp, revealViewport, staggerContainer } from "../../lib/animations";

/** Section "Contact" : email + liens GitHub / LinkedIn. */
export default function Contact() {
  const { personal } = content;
  const { t } = useLang();

  const links = [
    { label: "Email", value: personal.email, href: `mailto:${personal.email}` },
    { label: "GitHub", value: "@florianhemery", href: personal.github },
    {
      label: "LinkedIn",
      value: "florian-hemery",
      href: personal.linkedin,
    },
  ];

  return (
    <Section id="contact" eyebrow={t.contact.eyebrow} title={t.contact.title}>
      <motion.div
        className="glass-panel rounded-2xl p-8 sm:p-12"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
      >
        <motion.p
          variants={fadeUp}
          className="max-w-xl text-lg leading-relaxed text-muted"
        >
          {t.contact.subtitle}
        </motion.p>

        <motion.a
          variants={fadeUp}
          href={`mailto:${personal.email}`}
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.03] focus-visible:scale-[1.03]"
        >
          {t.contact.emailCta}
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            →
          </span>
        </motion.a>

        <motion.ul
          variants={fadeUp}
          className="mt-10 grid gap-4 border-t border-[var(--color-line)] pt-8 sm:grid-cols-3"
        >
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                className="block"
              >
                <span className="eyebrow">{link.label}</span>
                <span className="mt-1 block text-fg transition-colors group-hover:text-accent hover:text-accent">
                  {link.value}
                </span>
              </a>
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </Section>
  );
}
