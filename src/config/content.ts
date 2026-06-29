// Chargement du contenu typé. On importe le JSON et on le caste vers `Content`
// pour bénéficier de l'autocomplétion et de la vérification de types partout.
import type { Content } from "../types";
import data from "./content.json";

export const content = data as Content;
