/** Banco editorial propio: frases didácticas originales y máximas jurídicas de uso común.
 * No se atribuyen a personas que no hayan sido verificadas. Feed por día de México. */
export const LEGAL_PHRASES = [
"El Derecho organiza la convivencia y establece límites al poder.",
"La igualdad ante la ley exige mirar también las barreras reales.",
"Una norma jurídica puede imponer, prohibir o permitir conductas.",
"La dignidad humana es el punto de partida de los derechos.",
"El debido proceso protege incluso a quien enfrenta una acusación.",
"Sin independencia judicial, la justicia pierde garantías.",
"La presunción de inocencia impide tratar sospechas como condenas.",
"Conocer un derecho es el primer paso para poder ejercerlo.",
"La interpretación jurídica exige comprender texto y contexto.",
"Una sentencia debe explicar las razones de su decisión.",
"La certeza jurídica requiere reglas claras y previsibles.",
"Una obligación se estudia junto con su fuente y sus efectos.",
"El consentimiento es esencial en numerosas relaciones jurídicas.",
"La responsabilidad implica examinar conducta, daño y causalidad.",
"La prueba permite distinguir afirmaciones de hechos acreditados.",
"La argumentación no sustituye las fuentes del Derecho: dialoga con ellas.",
"Una Constitución ordena competencias y reconoce derechos.",
"El principio de legalidad limita la actuación de la autoridad.",
"Justicia y legalidad son conceptos relacionados, pero no idénticos.",
"El diálogo fortalece las soluciones pacíficas a los conflictos.",
"Los derechos humanos corresponden a todas las personas.",
"La publicidad de las normas favorece su conocimiento.",
"Una reforma no es lo mismo que una iniciativa legislativa.",
"Antes de citar un artículo, revisa su vigencia.",
"El Diario Oficial permite verificar normas federales publicadas.",
"Los derechos también requieren procedimientos para hacerse valer.",
"Una demanda plantea pretensiones que deben examinarse y probarse.",
"La buena fe orienta múltiples relaciones entre particulares.",
"La jurisprudencia se comprende dentro de su sistema jurídico.",
"Las normas morales y las jurídicas pueden coincidir sin ser iguales.",
"El pluralismo jurídico estudia diversas formas de normatividad.",
"Las costumbres sociales no siempre generan obligaciones legales.",
"La seguridad jurídica exige autoridades competentes.",
"La proporcionalidad ayuda a evaluar limitaciones a derechos.",
"El acceso a la justicia debe ser efectivo, no sólo formal.",
"El estudio del Derecho requiere escuchar posiciones distintas.",
"El conflicto de normas demanda criterios de solución.",
"La competencia determina quién puede resolver válidamente.",
"La motivación de los actos de autoridad ayuda a controlar su legalidad.",
"El contrato genera derechos y obligaciones conforme al ordenamiento.",
"El principio de contradicción fortalece el debate procesal.",
"La protección de datos personales también es un asunto jurídico.",
"La separación de poderes busca evitar la concentración del poder.",
"Los hechos del caso importan tanto como las normas aplicables.",
"Las fuentes del Derecho se consultan antes de responder.",
"La equidad puede orientar soluciones, según el marco aplicable.",
"Una opinión no equivale por sí sola a una regla jurídica.",
"Estudiar historia del Derecho ayuda a entender las instituciones presentes.",
"La ética profesional importa en cada decisión jurídica.",
"La argumentación precisa exige distinguir hechos, reglas y conclusiones.",
"El derecho a la defensa forma parte de las garantías procesales.",
"Leer el texto completo previene interpretaciones fuera de contexto.",
"Un buen jurista busca razones antes que respuestas automáticas.",
"El respeto mutuo sostiene una comunidad universitaria democrática.",
"La norma general se aplica al caso concreto mediante interpretación.",
"El acceso a la información facilita el control ciudadano.",
"Un acto jurídico requiere analizar requisitos y consecuencias.",
"La justicia cotidiana comienza con el reconocimiento del otro.",
"El lenguaje jurídico gana precisión cuando evita ambigüedades.",
"El estudio crítico permite identificar tensiones entre reglas y realidad."
] as const;
export function localDateKey(date=new Date()):string {
 return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Mexico_City",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
}
export function dailyLegalFeed(date=new Date()) {
 const day=localDateKey(date);
 const seed=Number(day.replace(/\D/g,""));
 const offset=seed%LEGAL_PHRASES.length;
 const step=7; // coprimo respecto a las 60 frases; sin repetir en la muestra diaria
 const items=Array.from({length:20},(_,i)=>({
  id:day+"-"+String(i+1), text:LEGAL_PHRASES[(offset+i*step)%LEGAL_PHRASES.length],
  category:"Reflexión jurídica",source:"Redacción editorial del portal"
 }));
 return {date:day,timeZone:"America/Mexico_City",updatedDaily:true,count:items.length,items};
}
