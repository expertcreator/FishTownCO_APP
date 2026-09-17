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
 * Crew member row / detail.
 */
export type CrewMember = {
  id: string;
  name: string;
  role: string;
  cert: string;
  expires: string;
  phone: string;
  email: string;
  tone: StatusTone;
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
 */
export const DEMO_VESSEL = {
  name: "Northern Star",
  type: "Fishing Vessel",
  length: "18.5 m",
  tonnage: "42 GT",
  flag: "United Kingdom",
  mmsi: "235098761",
  callSign: "MKDN5",
  homePort: "Grimsby",
  yearBuilt: "2009",
  skipper: "Capt. John Davies",
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
 * Demo crew roster.
 */
export const DEMO_CREW: CrewMember[] = [
  {
    id: "john",
    name: "Capt. John Davies",
    role: "Skipper",
    cert: "Master < 200 GT",
    expires: "Expires 11 Oct 2026",
    phone: "+44 7700 900123",
    email: "skipper@northernstar.co.uk",
    tone: "ok",
  },
  {
    id: "emma",
    name: "Emma Clarke",
    role: "Deckhand",
    cert: "STCW Basic Safety",
    expires: "Expires 02 Feb 2026",
    phone: "+44 7700 900456",
    email: "emma@northernstar.co.uk",
    tone: "due",
  },
  {
    id: "tom",
    name: "Tom Hughes",
    role: "Engineer",
    cert: "EOW / Engineering",
    expires: "Expires 19 Jul 2026",
    phone: "+44 7700 900789",
    email: "tom@northernstar.co.uk",
    tone: "ok",
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
