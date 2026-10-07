/** Catálogo del plan 2125 SUAyED. Fuente DGAE/SIAE consultada 2026-10-06.
 * Nombres desarrollados para lectura; no confundir el catálogo con la oferta de grupos.
 * Las claves no visibles en la fuente consultada se conservan como null (no inventadas).
 * Los id son referencias internas estables, no certificaciones de claves oficiales.
 */
export type PlanCourse = {
  id: string; code: string | null; name: string; semester: number | null;
  credits: number; kind: "obligatoria" | "optativa"; prerequisites: string[];
};
export const PLAN_SOURCE = "https://www.dgae-siae.unam.mx/educacion/planes.php?acc=est&pde=2125&planop=1";
export const PLAN_VERIFIED_AT = "2026-10-06";
export const PLAN_TOTAL_CREDITS = 450;
export const PLAN_REQUIRED_CREDITS = 366;
export const PLAN_ELECTIVE_CREDITS = 84;
export const PLAN_COURSES: PlanCourse[] = [
  {
    "id": "1121",
    "code": "1121",
    "name": "Acto Jurídico y Derecho de las Personas",
    "semester": 1,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1122",
    "code": "1122",
    "name": "Derecho Romano I",
    "semester": 1,
    "credits": 8,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1123",
    "code": null,
    "name": "Historia del Derecho Mexicano",
    "semester": 1,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1124",
    "code": "1124",
    "name": "Introducción a la Teoría del Derecho",
    "semester": 1,
    "credits": 8,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1125",
    "code": null,
    "name": "Ser Universitario y Cultura de la Legalidad",
    "semester": 1,
    "credits": 6,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1126",
    "code": null,
    "name": "Sociología Jurídica",
    "semester": 1,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1127",
    "code": null,
    "name": "Teoría General del Estado",
    "semester": 1,
    "credits": 8,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1221",
    "code": "1221",
    "name": "Bienes y Derechos Reales",
    "semester": 2,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1121"
    ]
  },
  {
    "id": "1222",
    "code": "1222",
    "name": "Derecho Penal",
    "semester": 2,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1223",
    "code": null,
    "name": "Derecho Romano II",
    "semester": 2,
    "credits": 8,
    "kind": "obligatoria",
    "prerequisites": [
      "1122"
    ]
  },
  {
    "id": "1224",
    "code": null,
    "name": "Ética Profesional del Jurista",
    "semester": 2,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1225",
    "code": null,
    "name": "Oratoria Forense y Debate Jurídico",
    "semester": 2,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1226",
    "code": null,
    "name": "Sistemas Jurídicos Contemporáneos",
    "semester": 2,
    "credits": 8,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1227",
    "code": "1227",
    "name": "Teoría de la Constitución",
    "semester": 2,
    "credits": 8,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1321",
    "code": null,
    "name": "Delitos en Particular",
    "semester": 3,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1222"
    ]
  },
  {
    "id": "1322",
    "code": "1322",
    "name": "Derecho Constitucional",
    "semester": 3,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1227"
    ]
  },
  {
    "id": "1323",
    "code": null,
    "name": "Metodología de la Investigación Jurídica",
    "semester": 3,
    "credits": 8,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1324",
    "code": "1324",
    "name": "Obligaciones",
    "semester": 3,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1221"
    ]
  },
  {
    "id": "1325",
    "code": null,
    "name": "Retórica para la Interpretación y Argumentación Jurídica",
    "semester": 3,
    "credits": 8,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1326",
    "code": "1326",
    "name": "Teoría General del Proceso",
    "semester": 3,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1421",
    "code": "1421",
    "name": "Contratos Civiles",
    "semester": 4,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1324"
    ]
  },
  {
    "id": "1422",
    "code": "1422",
    "name": "Derecho Internacional Público",
    "semester": 4,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1423",
    "code": "1423",
    "name": "Derecho Mercantil",
    "semester": 4,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1424",
    "code": "1424",
    "name": "Derechos Humanos y sus Garantías",
    "semester": 4,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1322"
    ]
  },
  {
    "id": "1425",
    "code": "1425",
    "name": "Economía y Derecho Económico",
    "semester": 4,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1426",
    "code": null,
    "name": "Mecanismos Alternos de Solución de Controversias",
    "semester": 4,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1521",
    "code": "1521",
    "name": "Derecho Administrativo",
    "semester": 5,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1522",
    "code": "1522",
    "name": "Derecho Familiar",
    "semester": 5,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1421"
    ]
  },
  {
    "id": "1523",
    "code": null,
    "name": "Derecho Internacional Privado",
    "semester": 5,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1422"
    ]
  },
  {
    "id": "1524",
    "code": "1524",
    "name": "Derecho Procesal Civil",
    "semester": 5,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1326"
    ]
  },
  {
    "id": "1525",
    "code": "1525",
    "name": "Juicio de Amparo y Derecho Procesal Constitucional",
    "semester": 5,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1424"
    ]
  },
  {
    "id": "1526",
    "code": "1526",
    "name": "Títulos y Operaciones de Crédito",
    "semester": 5,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1423"
    ]
  },
  {
    "id": "1621",
    "code": "1621",
    "name": "Contratos Mercantiles",
    "semester": 6,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1526"
    ]
  },
  {
    "id": "1622",
    "code": null,
    "name": "Control de Convencionalidad y Jurisprudencia",
    "semester": 6,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1525"
    ]
  },
  {
    "id": "1623",
    "code": "1623",
    "name": "Derecho del Trabajo",
    "semester": 6,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1624",
    "code": null,
    "name": "Derecho Indígena",
    "semester": 6,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1424"
    ]
  },
  {
    "id": "1625",
    "code": null,
    "name": "Derecho Procesal Administrativo",
    "semester": 6,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1521"
    ]
  },
  {
    "id": "1626",
    "code": null,
    "name": "Derecho Procesal Penal",
    "semester": 6,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1524"
    ]
  },
  {
    "id": "1627",
    "code": null,
    "name": "Derecho Sucesorio",
    "semester": 6,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1522"
    ]
  },
  {
    "id": "1721",
    "code": null,
    "name": "Derecho Agrario y Desarrollo Rural",
    "semester": 7,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1722",
    "code": null,
    "name": "Derecho Bancario y Bursátil",
    "semester": 7,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1621"
    ]
  },
  {
    "id": "1723",
    "code": "1723",
    "name": "Derecho Fiscal",
    "semester": 7,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1724",
    "code": null,
    "name": "Derecho Procesal del Trabajo",
    "semester": 7,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1623"
    ]
  },
  {
    "id": "1725",
    "code": null,
    "name": "Filosofía del Derecho",
    "semester": 7,
    "credits": 8,
    "kind": "obligatoria",
    "prerequisites": [
      "1124"
    ]
  },
  {
    "id": "1726",
    "code": null,
    "name": "Régimen Jurídico de Comercio Exterior",
    "semester": 7,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1821",
    "code": null,
    "name": "Derecho Ambiental y Desarrollo Sustentable",
    "semester": 8,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1822",
    "code": null,
    "name": "Derecho de la Seguridad Social",
    "semester": 8,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1823",
    "code": null,
    "name": "Derecho de las Telecomunicaciones",
    "semester": 8,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "1824",
    "code": null,
    "name": "Derecho Energético",
    "semester": 8,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1425"
    ]
  },
  {
    "id": "1825",
    "code": null,
    "name": "Derecho Procesal Fiscal",
    "semester": 8,
    "credits": 7,
    "kind": "obligatoria",
    "prerequisites": [
      "1723"
    ]
  },
  {
    "id": "1826",
    "code": null,
    "name": "Método del Caso",
    "semester": 8,
    "credits": 8,
    "kind": "obligatoria",
    "prerequisites": []
  },
  {
    "id": "opt-001",
    "code": null,
    "name": "Género y Derecho",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-002",
    "code": null,
    "name": "Curso Monográfico 1",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-003",
    "code": null,
    "name": "Curso Monográfico 2",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-004",
    "code": null,
    "name": "Curso Monográfico 3",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-005",
    "code": null,
    "name": "Curso Monográfico 4",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-006",
    "code": null,
    "name": "Curso Monográfico 5",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-007",
    "code": null,
    "name": "Curso Monográfico 6",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-008",
    "code": null,
    "name": "Curso Monográfico 7",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-009",
    "code": null,
    "name": "Curso Monográfico 8",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-010",
    "code": null,
    "name": "Curso Monográfico 9",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-011",
    "code": null,
    "name": "Curso Monográfico 10",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-012",
    "code": null,
    "name": "Curso Monográfico 11",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-013",
    "code": null,
    "name": "Curso Monográfico 12",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-014",
    "code": null,
    "name": "Bioética y Derecho",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-015",
    "code": null,
    "name": "Ciencias Forenses en el Sistema Penal Acusatorio",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-016",
    "code": null,
    "name": "Contabilidad y Finanzas para Juristas",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-017",
    "code": null,
    "name": "Criminología y Victimología",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-018",
    "code": null,
    "name": "Delitos Especiales",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-019",
    "code": null,
    "name": "Derecho Administrativo del Trabajo",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-020",
    "code": null,
    "name": "Derecho Aeronáutico y Espacial",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-021",
    "code": null,
    "name": "Derecho Agroalimentario",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-022",
    "code": null,
    "name": "Derecho Concursal",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-023",
    "code": null,
    "name": "Derecho Corporativo",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-024",
    "code": null,
    "name": "Derecho de la Competencia Económica",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-025",
    "code": null,
    "name": "Derecho de la Correduría Pública",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-026",
    "code": null,
    "name": "Derecho de las Fuerzas Armadas",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-027",
    "code": null,
    "name": "Derecho Deportivo",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-028",
    "code": null,
    "name": "Derecho Electoral",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-029",
    "code": null,
    "name": "Derecho Internacional del Trabajo",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-030",
    "code": null,
    "name": "Derecho Laboral Burocrático",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-031",
    "code": null,
    "name": "Derecho Marítimo",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-032",
    "code": null,
    "name": "Derecho Municipal y de las Alcaldías",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-033",
    "code": null,
    "name": "Derecho Notarial y Registral",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-034",
    "code": null,
    "name": "Derecho Procesal Agrario",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-035",
    "code": null,
    "name": "Derecho Procesal Familiar y Sucesorio",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-036",
    "code": null,
    "name": "Derecho Procesal Mercantil",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-037",
    "code": null,
    "name": "Derecho Sanitario",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-038",
    "code": null,
    "name": "Derecho Urbanístico, Vivienda y Asentamientos Humanos",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-039",
    "code": null,
    "name": "Derecho y Literatura",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-040",
    "code": null,
    "name": "Derecho y Operación Aduanera",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-041",
    "code": null,
    "name": "Derecho de las Tecnologías de la Información y Comunicación",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-042",
    "code": null,
    "name": "Derechos Humanos de las Personas en Situación de Vulnerabilidad",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-043",
    "code": null,
    "name": "Didáctica Jurídica",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-044",
    "code": null,
    "name": "Estadística Aplicada a las Ciencias Jurídicas",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-045",
    "code": null,
    "name": "Historiografía de Textos Jurídicos",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-046",
    "code": null,
    "name": "Inglés Jurídico - Legal English",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-047",
    "code": null,
    "name": "Instituciones de Derecho Financiero",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-048",
    "code": null,
    "name": "Inversión Extranjera",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-049",
    "code": null,
    "name": "Juicios Especiales Civiles",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-050",
    "code": null,
    "name": "Latín Jurídico",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-051",
    "code": null,
    "name": "Litigio Ambiental",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-052",
    "code": null,
    "name": "Litigio Estratégico en Derechos Humanos",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-053",
    "code": null,
    "name": "Lógica Jurídica",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-054",
    "code": null,
    "name": "Matemáticas Financieras",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-055",
    "code": null,
    "name": "México Nación Multicultural",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-056",
    "code": null,
    "name": "Planeación y Técnicas para el Logro de Objetivos Jurídicos",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-057",
    "code": null,
    "name": "Propiedad Intelectual",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-058",
    "code": null,
    "name": "Psicología Jurídica Forense",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-059",
    "code": null,
    "name": "Recursos Naturales y Cambio Climático",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-060",
    "code": null,
    "name": "Régimen Fiscal de las Personas Físicas",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-061",
    "code": null,
    "name": "Régimen Fiscal de las Personas Morales",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-062",
    "code": null,
    "name": "Régimen Jurídico Anticorrupción",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-063",
    "code": null,
    "name": "Régimen Jurídico de la Ciudad de México",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-064",
    "code": null,
    "name": "Régimen Jurídico de Protección de los Animales",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-065",
    "code": null,
    "name": "Resolución de Controversias de Comercio Exterior",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-066",
    "code": null,
    "name": "Responsabilidad Civil",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-067",
    "code": null,
    "name": "Responsabilidad Médica",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-068",
    "code": null,
    "name": "Responsabilidad Patrimonial del Estado Mexicano",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-069",
    "code": null,
    "name": "Seguridad Nacional y Seguridad Pública",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-070",
    "code": null,
    "name": "Seguros y Fianzas",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-071",
    "code": null,
    "name": "Teoría del Caso en Juicios Penales Adversariales",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-072",
    "code": null,
    "name": "Teoría General de la Administración",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-073",
    "code": null,
    "name": "Teoría Política",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-074",
    "code": null,
    "name": "Transparencia, Derecho a la Información y Protección de Datos Personales",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-075",
    "code": null,
    "name": "Tratados de Derecho Internacional Privado",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-076",
    "code": null,
    "name": "Asignatura de Movilidad I",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-077",
    "code": null,
    "name": "Asignatura de Movilidad II",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-078",
    "code": null,
    "name": "Asignatura de Movilidad III",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-079",
    "code": null,
    "name": "Asignatura de Movilidad IV",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-080",
    "code": null,
    "name": "Asignatura de Movilidad V",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-081",
    "code": null,
    "name": "Asignatura de Movilidad VI",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-082",
    "code": null,
    "name": "Asignatura de Movilidad VII",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-083",
    "code": null,
    "name": "Asignatura de Movilidad VIII",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-084",
    "code": null,
    "name": "Asignatura de Movilidad IX",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-085",
    "code": null,
    "name": "Asignatura de Movilidad X",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-086",
    "code": null,
    "name": "Asignatura de Movilidad XI",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  },
  {
    "id": "opt-087",
    "code": null,
    "name": "Asignatura de Movilidad XII",
    "semester": null,
    "credits": 7,
    "kind": "optativa",
    "prerequisites": []
  }
];
