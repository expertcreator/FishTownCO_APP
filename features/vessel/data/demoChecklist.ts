/**
 * Build-checklist item matching prototype screen 9.
 * Static catalog (not user-generated demo data).
 */
export type ChecklistItem = {
  id: string;
  title: string;
  standard: string;
};

/**
 * Statutory build checklist catalog from https://fishtownco.itoasis.co/ screen 9.
 */
export const BUILD_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "liferaft",
    title: "SOLAS A / ISO 9650 Liferaft & Hydrostatic Release",
    standard: "MCA MGN 553",
  },
  {
    id: "lifejackets",
    title: "Spinlock 170N/275N Commercial Lifejackets with Lights",
    standard: "BS EN ISO 12402-2",
  },
  {
    id: "epirb",
    title: "406 MHz GPS EPIRB (Annual Test & HRU)",
    standard: "Cospas-Sarsat Cat 1",
  },
  {
    id: "plb",
    title: "Personal Locator Beacons (PLB) for deck watch",
    standard: "MCA MSN 1874",
  },
  {
    id: "flares",
    title: "Bridge Parachute Red Rockets & Handheld Flares",
    standard: "SOLAS Annex 2",
  },
  {
    id: "fixed-fire",
    title: "Fixed Engine Room CO2 / Novec Flooding System",
    standard: "MCA Code SCV2",
  },
  {
    id: "extinguishers",
    title: "Portable Powder, Foam & CO2 Extinguishers (Annual)",
    standard: "BS EN 3",
  },
  {
    id: "fire-pump",
    title: "Emergency Fire Pump & Marine Fire Hoses",
    standard: "MCA Fishing Regs",
  },
  {
    id: "detection",
    title: "Thermal Fire & Smoke Detection Sensors",
    standard: "MED Wheelmark",
  },
  {
    id: "ais",
    title: "Fixed Class A / B AIS Transponder",
    standard: "IMO SN/Circ.227",
  },
  {
    id: "vhf",
    title: "VHF / DSC Marine Transceiver with MMSI",
    standard: "Ofcom Ship Radio",
  },
  {
    id: "compass",
    title: "Approved Magnetic Compass & Deviation Card",
    standard: "ISO 25862",
  },
  {
    id: "navtex",
    title: "Navtex / GMDSS Weather Warning Receiver",
    standard: "GMDSS Area A1",
  },
  {
    id: "registry",
    title: "UK Flag Registry Part 1 Certificate",
    standard: "Registry of Shipping",
  },
  {
    id: "scv2",
    title: "MCA Small Commercial Vessel Certificate (SCV2)",
    standard: "MCA Marine Office",
  },
  {
    id: "insurance",
    title: "Commercial Hull & P&I Liability Policy",
    standard: "Statutory Cover",
  },
  {
    id: "crew-records",
    title: "Crew Safety Induction Records & Risk Assessments",
    standard: "ILO Work in Fishing (C188)",
  },
];

/** @deprecated Use BUILD_CHECKLIST_ITEMS */
export const DEMO_BUILD_CHECKLIST = BUILD_CHECKLIST_ITEMS;
