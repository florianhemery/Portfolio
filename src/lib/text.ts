// Normalise les textes affiches issus de content.json : remplace les tirets
// longs (em dash / en dash) par un tiret normal, conformement a la regle "aucun
// em dash dans l'UI", sans modifier la source de verite.
export function clean(value: string): string {
  return value.replace(/—/g, "-").replace(/–/g, "-");
}
