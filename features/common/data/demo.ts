/**
 * Shared status tone for inventory / compliance badges.
 */
export type StatusTone = "ok" | "due" | "overdue" | "info";

/**
 * Safety inventory item shown across Home / Safety / Detail.
 */
export type SafetyItem = {
  id: string;
  name: string;
  category: string;
  location: string;
  dueDate: string;
  status: string;
  tone: StatusTone;
  serial?: string;
  notes?: string;
};

/**
 * Certificate / document in the vessel wallet.
 */
export type WalletDoc = {
  id: string;
  title: string;
  subtitle: string;
  expires: string;
  tone: StatusTone;
  code?: string;
};

/**
 * Certificate on a crew member profile.
 */
export type CrewCertificate = {
  id: string;
  title: string;
  expires: string;
  tone: StatusTone;
  hasAttachment?: boolean;
};

/**
 * Crew member row / detail (prototype screens 19-21).
 */
export type CrewMember = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  tone: StatusTone;
  medicalLabel: string;
  certificates: CrewCertificate[];
};

/**
 * Billing history row.
 */
export type BillingRow = {
  id: string;
  label: string;
  date: string;
  amount: string;
  status: string;
};

/**
 * Demo vessel used by setup / home / vessel screens.
 * Display strings aligned with https://fishtownco.itoasis.co/ My Vessel.
 */
export const DEMO_VESSEL = {
  name: "Northern Star",
  type: "Fishing Vessel",
  length: "42 ft / 12.8 m",
  lengthLabel: "42 ft / 12.8 m Fishing Vessel",
  usage: "Commercial Fishing & Day Charters",
  tonnage: "42 GT",
  flag: "United Kingdom",
  mmsi: "235098761",
  callSign: "MKDN5",
  homePort: "Grimsby",
  yearBuilt: "2009",
  skipper: "Capt. John Davies",
  engineHours: "1,420 hrs",
  nextServiceIn: "80 hrs",
};

/**
 * Demo safety inventory matching the prototype tone.
 */
export const DEMO_SAFETY_ITEMS: SafetyItem[] = [
  {
    id: "liferaft",
    name: "Liferaft 8-Person",
    category: "Life-saving",
    location: "Wheelhouse roof",
    dueDate: "12 Apr 2026",
    status: "Due in 42 days",
    tone: "due",
    serial: "LR-8-44291",
    notes: "Serviced annually. Hydrostatic release fitted.",
  },
  {
    id: "epirb",
    name: "EPIRB",
    category: "Distress",
    location: "Bridge",
    dueDate: "03 Aug 2026",
    status: "Valid",
    tone: "ok",
    serial: "EP-99102",
  },
  {
    id: "fire-ext",
    name: "Fire Extinguisher CO₂",
    category: "Fire",
    location: "Engine room",
    dueDate: "18 Jan 2026",
    status: "Overdue",
    tone: "overdue",
    serial: "FE-CO2-118",
  },
  {
    id: "flares",
    name: "Distress Flares Pack",
    category: "Distress",
    location: "Grab bag",
    dueDate: "30 Sep 2026",
    status: "Valid",
    tone: "ok",
  },
  {
    id: "lifejackets",
    name: "Lifejackets (x8)",
    category: "Life-saving",
    location: "Crew cabin",
    dueDate: "14 Jun 2026",
    status: "Valid",
    tone: "ok",
  },
];

/**
 * Demo wallet certificates.
 */
export const DEMO_WALLET: WalletDoc[] = [
  {
    id: "safety-cert",
    title: "Safety Certificate",
    subtitle: "MCA / Class survey",
    expires: "Expires 22 Nov 2026",
    tone: "ok",
    code: "SC-NS-2024",
  },
  {
    id: "radio-lic",
    title: "Ship Radio Licence",
    subtitle: "Ofcom",
    expires: "Expires 09 Mar 2026",
    tone: "due",
    code: "SRL-77821",
  },
  {
    id: "insurance",
    title: "Hull & P&I Insurance",
    subtitle: "Northern Marine Cover",
    expires: "Expires 01 Jan 2027",
    tone: "ok",
    code: "POL-448291",
  },
];

/**
 * Demo crew roster matching prototype screen 19.
 */
export const DEMO_CREW: CrewMember[] = [
  {
    id: "james",
    name: "James Hart",
    role: "Skipper & Master 200gt",
    phone: "+44 7700 900412",
    email: "james.hart@fishtown.co.uk",
    tone: "overdue",
    medicalLabel: "ENG1 Medical: 14 Oct 2024 (Expired)",
    certificates: [
      { id: "jh-1", title: "Medical (ENG1)", expires: "14 Oct 2024", tone: "overdue", hasAttachment: true },
      { id: "jh-2", title: "Sea Survival", expires: "28 Nov 2025", tone: "due", hasAttachment: true },
      { id: "jh-3", title: "Fire Fighting", expires: "12 Aug 2026", tone: "ok", hasAttachment: true },
      { id: "jh-4", title: "First Aid at Sea", expires: "04 May 2027", tone: "ok", hasAttachment: true },
      { id: "jh-5", title: "Health & Safety", expires: "19 Jan 2027", tone: "ok", hasAttachment: true },
      { id: "jh-6", title: "Radio (GMDSS / VHF)", expires: "30 Sep 2028", tone: "ok", hasAttachment: true },
    ],
  },
  {
    id: "callum",
    name: "Callum Reid",
    role: "Chief Engineer (MEOL)",
    phone: "+44 7700 900413",
    email: "callum.reid@fishtown.co.uk",
    tone: "due",
    medicalLabel: "ENG1 Medical: 01 Sep 2026",
    certificates: [
      { id: "cr-1", title: "Medical (ENG1)", expires: "01 Sep 2026", tone: "due", hasAttachment: true },
      { id: "cr-2", title: "MEOL / Engineering", expires: "15 Mar 2028", tone: "ok", hasAttachment: true },
    ],
  },
  {
    id: "elena",
    name: "Elena Rostova",
    role: "Lead Deckhand & Safety Officer",
    phone: "+44 7700 900414",
    email: "elena.rostova@fishtown.co.uk",
    tone: "ok",
    medicalLabel: "ENG1 Medical: 18 May 2027",
    certificates: [
      { id: "er-1", title: "Medical (ENG1)", expires: "18 May 2027", tone: "ok", hasAttachment: true },
      { id: "er-2", title: "Advanced Fire Fighting", expires: "22 Oct 2027", tone: "ok", hasAttachment: true },
    ],
  },
  {
    id: "marcus",
    name: "Marcus Vance",
    role: "Deckhand & Winchman",
    phone: "+44 7700 900415",
    email: "marcus.vance@fishtown.co.uk",
    tone: "ok",
    medicalLabel: "ENG1 Medical: 20 Jan 2029",
    certificates: [
      { id: "mv-1", title: "Medical (ENG1)", expires: "20 Jan 2029", tone: "ok", hasAttachment: true },
    ],
  },
  {
    id: "tom",
    name: "Tom Fletcher",
    role: "Deckhand",
    phone: "+44 7700 900416",
    email: "tom.fletcher@fishtown.co.uk",
    tone: "due",
    medicalLabel: "ENG1 Medical: 14 Jul 2026",
    certificates: [
      { id: "tf-1", title: "Medical (ENG1)", expires: "14 Jul 2026", tone: "due", hasAttachment: true },
    ],
  },
  {
    id: "sarah",
    name: "Sarah Bell",
    role: "Cook & Steward",
    phone: "+44 7700 900417",
    email: "sarah.bell@fishtown.co.uk",
    tone: "ok",
    medicalLabel: "ENG1 Medical: 14 Feb 2028",
    certificates: [
      { id: "sb-1", title: "Medical (ENG1)", expires: "14 Feb 2028", tone: "ok", hasAttachment: true },
    ],
  },
];

/**
 * Demo billing rows.
 */
export const DEMO_BILLING: BillingRow[] = [
  {
    id: "b1",
    label: "Vessel Companion — Annual",
    date: "12 Jan 2026",
    amount: "£149.00",
    status: "Paid",
  },
  {
    id: "b2",
    label: "Vessel Companion — Annual",
    date: "12 Jan 2025",
    amount: "£129.00",
    status: "Paid",
  },
  {
    id: "b3",
    label: "Extra crew seats (×2)",
    date: "03 Jun 2025",
    amount: "£36.00",
    status: "Paid",
  },
];

/**
 * Checklist categories for vessel build checklist.
 */
export const DEMO_CHECKLIST = [
  {
    id: "life",
    title: "Life-saving appliances",
    items: ["Liferaft", "Lifejackets", "Immersion suits", "MOB recovery"],
  },
  {
    id: "fire",
    title: "Fire fighting",
    items: ["Extinguishers", "Fire blanket", "Detection system"],
  },
  {
    id: "nav",
    title: "Navigation & radio",
    items: ["EPIRB", "VHF", "AIS", "Charts / ECDIS"],
  },
  {
    id: "docs",
    title: "Certificates & docs",
    items: ["Safety certificate", "Insurance", "Radio licence", "Crew tickets"],
  },
];

/**
 * Maps a status tone to soft background / text colors.
 * @param tone - Status tone
 * @returns Color pair for badges
 */
export function toneColors(tone: StatusTone): { bg: string; text: string } {
  switch (tone) {
    case "ok":
      return { bg: "#E4F5EC", text: "#1F7A4D" };
    case "due":
      return { bg: "#FFF4E0", text: "#B45309" };
    case "overdue":
      return { bg: "#FDECEC", text: "#B91C1C" };
    default:
      return { bg: "#E2F1F8", text: "#0F5F73" };
  }
}
