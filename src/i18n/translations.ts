// Dictionnaire i18n FR / EN pour toute l'interface.
// Les DONNEES de contenu (projets, parcours, notes) restent en francais (source
// de verite content.json). Ici on traduit uniquement l'habillage de l'UI, plus
// quelques textes redactionnels (accroche, intro, contact).

export type Lang = "fr" | "en";

const fr = {
  nav: {
    about: "À propos",
    skills: "Compétences",
    timeline: "Parcours",
    projects: "Projets",
    contact: "Contact",
    backToTop: "Retour en haut",
    toggleLang: "Switch to English",
  },
  hero: {
    status: "Disponible / alternance / projets",
    accroche:
      "Développeur passionné, formé à Epitech. Du C bas niveau au web, avec un passage en entreprise à la DSI Digital JCDecaux.",
    ctaProjects: "Voir les projets",
    ctaContact: "Me contacter",
    scroll: "Défiler",
  },
  about: {
    eyebrow: "À propos",
    title: "Rigueur, curiosité et autonomie",
    bio: "Passionné par la technologie depuis l'enfance, mon parcours à Epitech a été marqué par une prise de conscience décisive. J'ai effectué mon stage de Tek 2 à la DSI Digital JCDecaux (août à décembre 2025), puis enchaîné sur la piscine Tek 2 en janvier 2026. Je suis actuellement en Tek 2 jusqu'à début juillet.",
    highlight:
      "Point fort : stage à la DSI Digital JCDecaux et soutenance de stage notée 20/20.",
  },
  skills: {
    eyebrow: "Stack",
    title: "Compétences",
    subtitle: "Les technologies que je pratique, par domaine.",
  },
  timeline: {
    eyebrow: "Parcours",
    title: "Mon parcours",
    subtitle: "Du premier jour à Epitech jusqu'à la Tek 2 en cours.",
  },
  projects: {
    eyebrow: "Réalisations",
    title: "Projets",
    subtitle: "Sélection de projets Epitech et de stage, filtrables par domaine.",
    all: "Tous",
    grade: "Note",
    noGrade: "Non noté",
    module: "Module",
    skills: "Compétences",
    close: "Fermer",
    open: "Voir le détail",
  },
  stats: {
    eyebrow: "En chiffres",
    title: "Quelques chiffres",
  },
  testimonials: {
    eyebrow: "Témoignages",
    title: "Recommandations",
  },
  contact: {
    eyebrow: "Contact",
    title: "Travaillons ensemble",
    subtitle:
      "Une opportunité, une question, un projet ? Je réponds rapidement.",
    emailCta: "M'écrire un mail",
  },
  footer: {
    built: "Conçu et développé par",
    rights: "Tous droits réservés.",
  },
};

// Le type du dictionnaire derive du francais : l'anglais doit en respecter la
// forme (memes cles, valeurs de type string).
export type Dict = typeof fr;

const en: Dict = {
  nav: {
    about: "About",
    skills: "Skills",
    timeline: "Journey",
    projects: "Projects",
    contact: "Contact",
    backToTop: "Back to top",
    toggleLang: "Passer en francais",
  },
  hero: {
    status: "Available / apprenticeship / projects",
    accroche:
      "A developer passionate since childhood, trained at Epitech. From low level C to the web, with an internship at JCDecaux Digital IT.",
    ctaProjects: "View projects",
    ctaContact: "Get in touch",
    scroll: "Scroll",
  },
  about: {
    eyebrow: "About",
    title: "Rigor, curiosity and autonomy",
    bio: "Passionate about technology since childhood, my time at Epitech was shaped by a decisive turning point. I did my Tek 2 internship at JCDecaux Digital IT (August to December 2025), then went straight into the Tek 2 bootcamp in January 2026. I am currently in Tek 2 until early July.",
    highlight:
      "Highlight: internship at JCDecaux Digital IT and a final internship defense graded 20/20.",
  },
  skills: {
    eyebrow: "Stack",
    title: "Skills",
    subtitle: "The technologies I work with, by domain.",
  },
  timeline: {
    eyebrow: "Journey",
    title: "My journey",
    subtitle: "From day one at Epitech to the ongoing Tek 2 year.",
  },
  projects: {
    eyebrow: "Work",
    title: "Projects",
    subtitle: "A selection of Epitech and internship projects, filterable by domain.",
    all: "All",
    grade: "Grade",
    noGrade: "Not graded",
    module: "Module",
    skills: "Skills",
    close: "Close",
    open: "View details",
  },
  stats: {
    eyebrow: "By the numbers",
    title: "A few numbers",
  },
  testimonials: {
    eyebrow: "Testimonials",
    title: "Recommendations",
  },
  contact: {
    eyebrow: "Contact",
    title: "Let's work together",
    subtitle: "An opportunity, a question, a project? I reply quickly.",
    emailCta: "Send me an email",
  },
  footer: {
    built: "Designed and built by",
    rights: "All rights reserved.",
  },
};

export const translations: Record<Lang, Dict> = { fr, en };
