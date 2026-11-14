export type HoardItemType =
  | "costco_hotdog"
  | "switch_2"
  | "steam_game"
  | "coffee"
  | "groceries"
  | "takeout"
  | "clothing"
  | "fuel"
  | "subscription"
  | "experience"
  | "general";

export interface HoardCatalogEntry {
  type: HoardItemType;
  label: string;
  pluralLabel: string;
  defaultUnitCents: number;
  categoryHint: string;
  accentColor: string;
}

export const HOARD_CATALOG: Record<HoardItemType, HoardCatalogEntry> = {
  costco_hotdog: {
    type: "costco_hotdog",
    label: "Costco Hot Dog",
    pluralLabel: "Costco Hot Dogs",
    defaultUnitCents: 150,
    categoryHint: "Dining & Coffee",
    accentColor: "#C45B3E",
  },
  switch_2: {
    type: "switch_2",
    label: "Nintendo Switch 2",
    pluralLabel: "Nintendo Switch 2s",
    defaultUnitCents: 44999,
    categoryHint: "Entertainment & Experiences",
    accentColor: "#C45B3E",
  },
  steam_game: {
    type: "steam_game",
    label: "Steam Game",
    pluralLabel: "Steam Games",
    defaultUnitCents: 5000,
    categoryHint: "Entertainment & Experiences",
    accentColor: "#3F5563",
  },
  coffee: {
    type: "coffee",
    label: "Artisan Coffee",
    pluralLabel: "Coffees & Lattes",
    defaultUnitCents: 650,
    categoryHint: "Dining & Coffee",
    accentColor: "#9A7B3E",
  },
  groceries: {
    type: "groceries",
    label: "Grocery Haul",
    pluralLabel: "Grocery Totes",
    defaultUnitCents: 5000,
    categoryHint: "Groceries",
    accentColor: "#1B4D3E",
  },
  takeout: {
    type: "takeout",
    label: "Meal & Takeout",
    pluralLabel: "Dining & Takeout Boxes",
    defaultUnitCents: 2200,
    categoryHint: "Dining & Coffee",
    accentColor: "#C45B3E",
  },
  clothing: {
    type: "clothing",
    label: "Apparel & Gear",
    pluralLabel: "Apparel & Sneaker Boxes",
    defaultUnitCents: 5500,
    categoryHint: "Shopping & Wants",
    accentColor: "#B4690E",
  },
  fuel: {
    type: "fuel",
    label: "Transit & Gas",
    pluralLabel: "Gas Cans & Rides",
    defaultUnitCents: 3500,
    categoryHint: "Transit & Fuel",
    accentColor: "#3F5563",
  },
  subscription: {
    type: "subscription",
    label: "Subscription Pass",
    pluralLabel: "Monthly Subscriptions",
    defaultUnitCents: 1500,
    categoryHint: "Subscriptions & Bills",
    accentColor: "#4A7C59",
  },
  experience: {
    type: "experience",
    label: "Event & Ticket",
    pluralLabel: "Event Tickets",
    defaultUnitCents: 3500,
    categoryHint: "Entertainment & Experiences",
    accentColor: "#9A7B3E",
  },
  general: {
    type: "general",
    label: "Package & Gear",
    pluralLabel: "Delivered Packages",
    defaultUnitCents: 3500,
    categoryHint: "Shopping & Wants",
    accentColor: "#5E6A64",
  },
};

export function inferHoardItem(params: {
  merchantName: string;
  amountCents: number;
  plaidPrimaryCategory?: string | null;
  plaidDetailedCategory?: string | null;
  explicitType?: string | null;
  explicitLabel?: string | null;
  explicitQuantity?: number | null;
}): {
  hoardItemType: HoardItemType;
  hoardItemLabel: string;
  hoardQuantity: number;
} {
  const m = params.merchantName.toLowerCase();
  const primary = (params.plaidPrimaryCategory || "").toUpperCase();
  const detailed = (params.plaidDetailedCategory || "").toUpperCase();
  const cents = Math.max(1, params.amountCents);

  if (
    params.explicitType &&
    params.explicitType in HOARD_CATALOG
  ) {
    const type = params.explicitType as HoardItemType;
    const entry = HOARD_CATALOG[type];
    const qty =
      params.explicitQuantity && params.explicitQuantity > 0
        ? params.explicitQuantity
        : Math.max(1, Math.round(cents / entry.defaultUnitCents));
    return {
      hoardItemType: type,
      hoardItemLabel: params.explicitLabel || entry.label,
      hoardQuantity: qty,
    };
  }

  let type: HoardItemType = "general";

  if (
    m.includes("hot dog") ||
    m.includes("hotdog") ||
    m.includes("food court") ||
    (m.includes("costco") && cents <= 2500 && cents % 150 === 0)
  ) {
    type = "costco_hotdog";
  } else if (
    m.includes("switch 2") ||
    m.includes("nintendo") ||
    ((m.includes("best buy") || m.includes("gamestop")) &&
      cents >= 39000 &&
      cents <= 56000)
  ) {
    type = "switch_2";
  } else if (m.includes("steam") || m.includes("valve")) {
    type = "steam_game";
  } else if (
    m.includes("coffee") ||
    m.includes("blue bottle") ||
    m.includes("starbucks") ||
    m.includes("philz") ||
    detailed.includes("COFFEE")
  ) {
    type = "coffee";
  } else if (
    detailed.includes("GROCER") ||
    m.includes("trader joe") ||
    m.includes("whole foods") ||
    m.includes("costco") ||
    m.includes("aldi") ||
    m.includes("kroger") ||
    m.includes("safeway")
  ) {
    type = "groceries";
  } else if (
    primary === "FOOD_AND_DRINK" ||
    m.includes("sweetgreen") ||
    m.includes("tartine") ||
    m.includes("chipotle") ||
    m.includes("doordash") ||
    m.includes("uber eats") ||
    m.includes("bistro")
  ) {
    type = "takeout";
  } else if (
    m.includes("uniqlo") ||
    m.includes("nordstrom") ||
    m.includes("zara") ||
    m.includes("nike") ||
    detailed.includes("CLOTHING")
  ) {
    type = "clothing";
  } else if (
    primary === "TRANSPORTATION" ||
    m.includes("chevron") ||
    m.includes("shell") ||
    m.includes("uber") ||
    m.includes("lyft") ||
    m.includes("metro")
  ) {
    type = "fuel";
  } else if (
    primary === "RENT_AND_UTILITIES" ||
    detailed.includes("SUBSCRIPTION") ||
    m.includes("spotify") ||
    m.includes("netflix") ||
    m.includes("icloud") ||
    m.includes("apple.com")
  ) {
    type = "subscription";
  } else if (
    primary === "ENTERTAINMENT" ||
    m.includes("amc") ||
    m.includes("cinema") ||
    m.includes("ticket") ||
    m.includes("museum")
  ) {
    type = "experience";
  }

  const entry = HOARD_CATALOG[type];
  const qty =
    params.explicitQuantity && params.explicitQuantity > 0
      ? params.explicitQuantity
      : type === "switch_2"
        ? 1
        : Math.max(1, Math.round(cents / entry.defaultUnitCents));

  return {
    hoardItemType: type,
    hoardItemLabel: params.explicitLabel || entry.label,
    hoardQuantity: qty,
  };
}

export interface HoardTransactionInput {
  id: string;
  merchantName: string;
  amountCents: number;
  date: string;
  plaidPrimaryCategory?: string | null;
  plaidDetailedCategory?: string | null;
  hoardItemType?: string | null;
  hoardItemLabel?: string | null;
  hoardQuantity?: number | null;
  budgetStatusAtPurchase: string;
  mindfulReflection: string | null;
  envelope: { id: string; name: string } | null;
}

export interface HoardCluster {
  type: HoardItemType;
  label: string;
  pluralLabel: string;
  totalQuantity: number;
  totalSpentCents: number;
  accentColor: string;
  transactions: HoardTransactionInput[];
}

export function buildHoardClusters(
  transactions: HoardTransactionInput[]
): HoardCluster[] {
  const map = new Map<HoardItemType, HoardCluster>();

  for (const tx of transactions) {
    if (tx.amountCents <= 0) continue;
    const inferred = inferHoardItem({
      merchantName: tx.merchantName,
      amountCents: tx.amountCents,
      plaidPrimaryCategory: tx.plaidPrimaryCategory,
      plaidDetailedCategory: tx.plaidDetailedCategory,
      explicitType: tx.hoardItemType,
      explicitLabel: tx.hoardItemLabel,
      explicitQuantity: tx.hoardQuantity,
    });

    const entry = HOARD_CATALOG[inferred.hoardItemType];
    const existing = map.get(inferred.hoardItemType);
    if (existing) {
      existing.totalQuantity += inferred.hoardQuantity;
      existing.totalSpentCents += tx.amountCents;
      existing.transactions.push(tx);
    } else {
      map.set(inferred.hoardItemType, {
        type: inferred.hoardItemType,
        label: entry.label,
        pluralLabel: entry.pluralLabel,
        totalQuantity: inferred.hoardQuantity,
        totalSpentCents: tx.amountCents,
        accentColor: entry.accentColor,
        transactions: [tx],
      });
    }
  }

  // Put big iconic items & large quantity hoards in a visually exciting order
  const priorityOrder: HoardItemType[] = [
    "switch_2",
    "steam_game",
    "costco_hotdog",
    "coffee",
    "groceries",
    "takeout",
    "clothing",
    "experience",
    "fuel",
    "subscription",
    "general",
  ];

  return Array.from(map.values()).sort(
    (a, b) => priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type)
  );
}
