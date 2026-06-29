// Types TypeScript decrivant la structure de src/config/content.json.
// content.json est l'unique source de verite : ces types le refletent fidelement.

export interface Personal {
  name: string;
  title: string;
  subtitle: string;
  email: string;
  github: string;
  linkedin: string;
  photo: string;
  bio: string;
}

export interface Stat {
  id: string;
  label: string;
  value: number;
  suffix: string;
}

export interface ParcoursStep {
  id: string;
  year: string;
  title: string;
  desc: string;
  tag: string;
}

// Un projet peut ne pas avoir de note (grade null) : on gere ce cas dans l'UI.
export interface Project {
  title: string;
  year: string;
  module: string;
  grade: string | null;
  longDesc: string;
  skills: string[];
}

export interface ParcoursCategory {
  id: string;
  label: string;
  module: string | null;
  projects: Project[];
}

export interface Skill {
  name: string;
  category: SkillCategory;
  icon: string;
}

export type SkillCategory =
  | "Systems"
  | "Frontend"
  | "Backend"
  | "DevOps"
  | "Data";

export interface Testimonial {
  id: string;
  text: string;
  text_fr: string;
  author: string;
  role: string;
  role_en: string;
}

export interface Content {
  personal: Personal;
  stats: Stat[];
  parcoursSteps: ParcoursStep[];
  parcoursCategories: ParcoursCategory[];
  projects: Project[];
  skills: Skill[];
  testimonials: Testimonial[];
  navLinks: string[];
  terminalCommands: Record<string, string>;
}
