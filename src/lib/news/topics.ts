/**
 * Picks the legal topic of a headline so a card without a source photo gets an illustration that matches it
 * (agrarian law, elections, a court ruling, a decree, taxes…) instead of one generic picture per category.
 * Pure and deterministic: the same headline always gets the same topic and layout.
 */
export type NewsTopic =
  | "agrario" | "electoral" | "penal" | "corte" | "sentencia" | "legislacion" | "etica" | "convenio" | "economia"
  | "tecnologia" | "salud" | "derechos" | "trabajo" | "ambiente" | "academia" | "internacional" | "maritimo"
  | "administracion" | "propiedad" | "registro" | "facultad" | "abierta" | "comunidad";

type Rule = { topic: NewsTopic; words: RegExp };
// Accents are removed before matching, so patterns are written without them.
const RULES: Rule[] = [
  // Specific subjects first; generic ones (court, ruling, law, agreement, academia) only win when nothing specific matches.
  { topic: "agrario", words: /\b(agrari|ejid|campesin|dotacion de tierras|tierras|rural|comunal|parcel)/ },
  { topic: "electoral", words: /\b(elector|eleccion|votacion|voto|casilla|candidat|regidur|partido politico|ine\b|tepjf|sala superior|ayuntamiento)/ },
  { topic: "penal", words: /\b(penal|delito|fiscalia|fgr\b|prision|carcel|victima|armas|seguridad publica|homicid|secuestr|crimen|feminicid|acida)/ },
  { topic: "etica", words: /\b(codigo de conducta|etica|anticorrupcion|transparencia|rendicion de cuentas|integridad|buen gobierno|responsabilidades administrativas)/ },
  { topic: "maritimo", words: /\b(marina|portuari|puerto|naval|maritim|aduana)/ },
  { topic: "economia", words: /\b(hacienda|fiscal|impuesto|estimulo|tasa|interes|tipo de cambio|banco de mexico|presupuest|gasolina|diesel|tarifa|credito|financ|moneda|economi)/ },
  { topic: "tecnologia", words: /\b(tecnolog|digital|telecomunic|inteligencia artificial|\bia\b|datos personales|ciber|internet|innovacion|ciencia)/ },
  { topic: "ambiente", words: /\b(ambient|clima|agua|ecolog|bosque|energia|residuos|bienestar animal|animal|veterinari|biodiversidad|contaminacion)/ },
  { topic: "salud", words: /\b(salud|medic|hospital|salubridad|sanitari|vacun|enfermedad|mental|farmac)/ },
  { topic: "derechos", words: /\b(derechos humanos|mujer|genero|igualdad|discrimin|ninas|ninos|infancia|feminis|violencia|inclusion|indigen|activismo|25n|cuidados|diversidad)/ },
  { topic: "trabajo", words: /\b(laboral|trabajo|trabajador|empleo|jornada laboral|horas de trabajo|salario|sindicat|seguridad social|pension)/ },
  { topic: "propiedad", words: /\b(propiedad intelectual|derechos de autor|patente|marca registrada|cultura|arte|patrimonio|vitral|museo)/ },
  { topic: "registro", words: /\b(curp|registro|registral|catastr|poblacion|identidad|asociacion religiosa|notari|acta)/ },
  { topic: "internacional", words: /\b(internacional|migra|extranjer|tratado|onu\b|consul|frontera|refugi|europa|global)/ },
  { topic: "corte", words: /\b(suprema corte|scjn|pleno|amparo|constitucional|controversia constitucional|accion de inconstitucionalidad|jurisprudencia|ministr)/ },
  { topic: "sentencia", words: /\b(sentencia|juicio|tribunal|resuelve|resolucion|sala\b|juez|jueza|juzgad|magistrad|organo de administracion judicial|poder judicial)/ },
  { topic: "legislacion", words: /\b(decreto|reforma|ley\b|leyes|iniciativa|dictamen|comision|senado|diputad|legislativ|codigo (?!de conducta)|reglamento|congreso de la union|transitori)/ },
  { topic: "convenio", words: /\b(convenio|coordinacion|colaboracion|acuerdo de|firma|alianza)/ },
  { topic: "administracion", words: /\b(manual de organizacion|designacion|nombramiento|estructura organica|administracion publica|circular|dependencias|lineamientos)/ },
  { topic: "academia", words: /\b(universidad|unam|seminario|congreso internacional|coloquio|libro|presentacion|tesis|curso|taller|conferencia|catedra|ensenanza|estudiante|jornada academica|mesa de dialogo|investigacion)/ },
];
/** Broad subjects that almost every legal headline touches; they only win when nothing more specific matches. */
const GENERIC = new Set<NewsTopic>(["sentencia", "legislacion", "convenio", "administracion", "academia"]);
const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Each match scores its length, so a precise phrase ("código de conducta", "dotación de tierras") beats a loose word
 * ("tecnológica" in an institute's name). Title matches weigh triple; an all-caps summary is DOF's ministry name and
 * weighs half. Ties keep the order of RULES (specific subjects first).
 */
export function newsTopic(item: { title: string; summary?: string | null; category: string }): NewsTopic {
  const rawSummary = item.summary ?? "";
  const title = plain(item.title), summary = plain(rawSummary);
  const summaryWeight = rawSummary && rawSummary === rawSummary.toLocaleUpperCase("es") ? 0.5 : 1;
  const weigh = (text: string, g: RegExp) => (text.match(g) ?? []).reduce((sum, m) => sum + Math.min(m.length, 14), 0);
  let best: NewsTopic | null = null, bestScore = 0;
  for (const rule of RULES) {
    const g = new RegExp(rule.words.source, "g");
    const score = (weigh(title, g) * 3 + weigh(summary, g) * summaryWeight) * (GENERIC.has(rule.topic) ? 0.6 : 1);
    if (score > bestScore) { best = rule.topic; bestScore = score; }
  }
  if (best) return best;
  const c = plain(item.category);
  if (c.includes("abierta")) return "abierta";
  if (c.includes("legisl")) return "legislacion";
  if (c.includes("justicia")) return "sentencia";
  if (c.includes("comunidad")) return "comunidad";
  return "facultad";
}

/** Small stable hash so each card varies its layout without randomness between renders. */
export function stableHash(value: string): number {
  let h = 2166136261;
  for (const c of value) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
