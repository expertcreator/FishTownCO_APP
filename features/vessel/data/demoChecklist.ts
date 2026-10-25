/**
 * Build-checklist item matching prototype screen 9.
 * Static catalog (not user-generated demo data).
 */
export type ChecklistKind = "safety" | "document";

export type ChecklistItem = {
  id: string;
  title: string;
  standard: string;
  /** Safety inventory or wallet document. */
  kind: ChecklistKind;
  /** Safety category, or a wallet category key for documents. */
  category: string;
  /** Wallet document type. Safety entries leave this empty. */
  docType?: string;
};

/**
 * Statutory build checklist catalog from https://fishtownco.itoasis.co/ screen 9.
 */
const LIFE_SAVING = "Life-Saving Appliances";
const FIRE = "Fire Detection & Extinction";
const NAVIGATION = "Navigation & Telecommunications";

export const BUILD_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "liferaft",
    title: "SOLAS A / ISO 9650 Liferaft & Hydrostatic Release",
    standard: "MCA MGN 553",
    kind: "safety",
    category: LIFE_SAVING,
  },
  {
    id: "lifejackets",
    title: "Spinlock 170N/275N Commercial Lifejackets with Lights",
    standard: "BS EN ISO 12402-2",
    kind: "safety",
    category: LIFE_SAVING,
  },
  {
    id: "epirb",
    title: "406 MHz GPS EPIRB (Annual Test & HRU)",
    standard: "Cospas-Sarsat Cat 1",
    kind: "safety",
    category: LIFE_SAVING,
  },
  {
    id: "plb",
    title: "Personal Locator Beacons (PLB) for deck watch",
    standard: "MCA MSN 1874",
    kind: "safety",
    category: LIFE_SAVING,
  },
  {
    id: "flares",
    title: "Bridge Parachute Red Rockets & Handheld Flares",
    standard: "SOLAS Annex 2",
    kind: "safety",
    category: LIFE_SAVING,
  },
  {
    id: "fixed-fire",
    title: "Fixed Engine Room CO2 / Novec Flooding System",
    standard: "MCA Code SCV2",
    kind: "safety",
    category: FIRE,
  },
  {
    id: "extinguishers",
    title: "Portable Powder, Foam & CO2 Extinguishers (Annual)",
    standard: "BS EN 3",
    kind: "safety",
    category: FIRE,
  },
  {
    id: "fire-pump",
    title: "Emergency Fire Pump & Marine Fire Hoses",
    standard: "MCA Fishing Regs",
    kind: "safety",
    category: FIRE,
  },
  {
    id: "detection",
    title: "Thermal Fire & Smoke Detection Sensors",
    standard: "MED Wheelmark",
    kind: "safety",
    category: FIRE,
  },
  {
    id: "ais",
    title: "Fixed Class A / B AIS Transponder",
    standard: "IMO SN/Circ.227",
    kind: "safety",
    category: NAVIGATION,
  },
  {
    id: "vhf",
    title: "VHF / DSC Marine Transceiver with MMSI",
    standard: "Ofcom Ship Radio",
    kind: "safety",
    category: NAVIGATION,
  },
  {
    id: "compass",
    title: "Approved Magnetic Compass & Deviation Card",
    standard: "ISO 25862",
    kind: "safety",
    category: NAVIGATION,
  },
  {
    id: "navtex",
    title: "Navtex / GMDSS Weather Warning Receiver",
    standard: "GMDSS Area A1",
    kind: "safety",
    category: NAVIGATION,
  },
  {
    id: "registry",
    title: "UK Flag Registry Part 1 Certificate",
    standard: "Registry of Shipping",
    kind: "document",
    category: "registry",
    docType: "Registration",
  },
  {
    id: "scv2",
    title: "MCA Small Commercial Vessel Certificate (SCV2)",
    standard: "MCA Marine Office",
    kind: "document",
    category: "compliance",
    docType: "Compliance Code",
  },
  {
    id: "insurance",
    title: "Commercial Hull & P&I Liability Policy",
    standard: "Statutory Cover",
    kind: "document",
    category: "insurance",
    docType: "Insurance",
  },
  {
    id: "crew-records",
    title: "Crew Safety Induction Records & Risk Assessments",
    standard: "ILO Work in Fishing (C188)",
    kind: "document",
    category: "other",
    docType: "Other",
  },
];

/** @deprecated Use BUILD_CHECKLIST_ITEMS */
export const DEMO_BUILD_CHECKLIST = BUILD_CHECKLIST_ITEMS;
