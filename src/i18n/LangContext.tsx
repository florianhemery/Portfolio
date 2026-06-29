import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations, type Dict, type Lang } from "./translations";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: Dict;
}

const LangContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = "portfolio-lang";

function initialLang(): Lang {
  if (typeof window === "undefined") return "fr";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "fr" || saved === "en") return saved;
  // Par defaut francais ; on bascule en anglais si la langue du navigateur l'est.
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "fr";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Persiste le choix et tient l'attribut lang du document a jour (a11y / SEO).
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggle = useCallback(
    () => setLangState((l) => (l === "fr" ? "en" : "fr")),
    []
  );

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, toggle, t: translations[lang] }),
    [lang, setLang, toggle]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang doit etre utilise dans <LangProvider>");
  return ctx;
}
