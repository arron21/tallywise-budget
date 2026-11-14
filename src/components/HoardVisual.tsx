"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Coins,
  Edit3,
  Layers,
  Palette,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import {
  HOARD_CATALOG,
  type HoardCluster,
  type HoardItemType,
  type HoardTransactionInput,
  buildHoardClusters,
} from "@/lib/hoard-engine";
import {
  calcTenYearOpportunityCents,
  calcWorkHours,
  formatCents,
} from "@/lib/format";

export type AvatarStyle = "explorer" | "gamer" | "foodie" | "cozy";

const AVATAR_STYLES: Array<{ id: AvatarStyle; label: string; tagline: string }> = [
  { id: "explorer", label: "Budget Explorer", tagline: "Field hat & satchel" },
  { id: "gamer", label: "Arcade Collector", tagline: "Headset & visor" },
  { id: "foodie", label: "Costco Regular", tagline: "Chef cap & apron" },
  { id: "cozy", label: "Mindful Minimalist", tagline: "Knit beanie & scarf" },
];

const AVATAR_COLORS = [
  { hex: "#1B4D3E", name: "Forest Emerald" },
  { hex: "#C45B3E", name: "Terracotta" },
  { hex: "#3F5563", name: "Slate Blue" },
  { hex: "#9A7B3E", name: "Warm Ochre" },
  { hex: "#4A7C59", name: "Sage" },
];

const STEAM_COVERS = [
  { src: "/images/hoard/steam-scifi.jpg", title: "Starfield Drifter" },
  { src: "/images/hoard/steam-fantasy.jpg", title: "Emberfall Chronicles" },
  { src: "/images/hoard/steam-racing.jpg", title: "Apex Horizon GP" },
  { src: "/images/hoard/steam-cozy.jpg", title: "Oakbrook Valley" },
];

export function CharacterAvatarSvg({
  style = "explorer",
  color = "#1B4D3E",
  size = 96,
}: {
  style?: string;
  color?: string;
  size?: number;
}) {
  const safeStyle = (["explorer", "gamer", "foodie", "cozy"].includes(style)
    ? style
    : "explorer") as AvatarStyle;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-label={`Collector avatar (${safeStyle})`}
    >
      {/* Pedestal glow ring */}
      <ellipse cx="60" cy="108" rx="34" ry="7" fill="rgba(26,35,32,0.12)" />

      {/* Torso / Jacket */}
      <path
        d="M32 104 C32 80, 44 72, 60 72 C76 72, 88 80, 88 104 Z"
        fill={color}
        stroke="#1A2320"
        strokeWidth="2.5"
      />
      {/* Shirt collar detail */}
      <path d="M51 73 L60 85 L69 73 Z" fill="#FAF8F3" />

      {/* Head */}
      <circle
        cx="60"
        cy="48"
        r="21"
        fill="#F4D3B8"
        stroke="#1A2320"
        strokeWidth="2.5"
      />

      {/* Rosy cheeks & cheerful expression */}
      <circle cx="49" cy="52" r="2.8" fill="#E89A84" opacity="0.7" />
      <circle cx="71" cy="52" r="2.8" fill="#E89A84" opacity="0.7" />
      <circle cx="52" cy="46" r="2.5" fill="#1A2320" />
      <circle cx="68" cy="46" r="2.5" fill="#1A2320" />
      <path
        d="M54 55 Q60 61 66 55"
        stroke="#1A2320"
        strokeWidth="2.3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Style-specific accessories */}
      {safeStyle === "explorer" && (
        <g>
          {/* Explorer brimmed hat */}
          <path
            d="M33 34 Q60 27 87 34 Q60 39 33 34 Z"
            fill="#9A7B3E"
            stroke="#1A2320"
            strokeWidth="2.2"
          />
          <path
            d="M42 33 C43 18, 77 18, 78 33 Z"
            fill="#B99652"
            stroke="#1A2320"
            strokeWidth="2.2"
          />
          <path d="M43 29 H77" stroke="#1B4D3E" strokeWidth="3" />
          {/* Satchel strap */}
          <path d="M41 78 L78 103" stroke="#9A7B3E" strokeWidth="4.5" strokeLinecap="round" />
        </g>
      )}

      {safeStyle === "gamer" && (
        <g>
          {/* Hair tuft */}
          <path
            d="M39 42 C40 24, 80 24, 81 42 C72 33, 48 33, 39 42 Z"
            fill="#27323F"
            stroke="#1A2320"
            strokeWidth="2"
          />
          {/* Gaming headset band & cups */}
          <path
            d="M36 47 C36 20, 84 20, 84 47"
            stroke="#3F5563"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect
            x="32"
            y="40"
            width="9"
            height="17"
            rx="4"
            fill="#C45B3E"
            stroke="#1A2320"
            strokeWidth="2"
          />
          <rect
            x="79"
            y="40"
            width="9"
            height="17"
            rx="4"
            fill="#1B4D3E"
            stroke="#1A2320"
            strokeWidth="2"
          />
          {/* Handheld mini badge on jacket */}
          <rect x="65" y="84" width="12" height="8" rx="2" fill="#FAF8F3" stroke="#1A2320" strokeWidth="1.5" />
        </g>
      )}

      {safeStyle === "foodie" && (
        <g>
          {/* Crisp chef / foodie cap */}
          <path
            d="M42 32 C35 20, 48 12, 60 15 C72 12, 85 20, 78 32 Z"
            fill="#FFFFFF"
            stroke="#1A2320"
            strokeWidth="2.2"
          />
          <rect
            x="42"
            y="29"
            width="36"
            height="7"
            rx="2"
            fill="#C45B3E"
            stroke="#1A2320"
            strokeWidth="2"
          />
          {/* Apron strings */}
          <path d="M47 75 V103 M73 75 V103" stroke="#FAF8F3" strokeWidth="3" />
        </g>
      )}

      {safeStyle === "cozy" && (
        <g>
          {/* Warm knit beanie */}
          <path
            d="M39 39 C40 20, 80 20, 81 39 Z"
            fill="#C45B3E"
            stroke="#1A2320"
            strokeWidth="2.2"
          />
          <circle cx="60" cy="18" r="5" fill="#FAF8F3" stroke="#1A2320" strokeWidth="2" />
          <rect
            x="38"
            y="34"
            width="44"
            height="8"
            rx="4"
            fill="#E4DDD0"
            stroke="#1A2320"
            strokeWidth="2"
          />
          {/* Scarf */}
          <path
            d="M42 71 Q60 80 78 71 L75 83 Q60 89 45 83 Z"
            fill="#E4DDD0"
            stroke="#1A2320"
            strokeWidth="2"
          />
        </g>
      )}
    </svg>
  );
}

export function Switch2ConsoleSvg({ width = 128 }: { width?: number }) {
  const height = Math.round(width * 0.56);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 180 100"
      fill="none"
      aria-label="Nintendo Switch 2 console"
    >
      {/* Left magnetic Joy-Con (matte charcoal with cyan inner accent) */}
      <path
        d="M24 14 H36 V86 H24 C12 86, 6 78, 6 66 V34 C6 22, 12 14, 24 14 Z"
        fill="#24292E"
        stroke="#1A2320"
        strokeWidth="2.5"
      />
      <rect x="33" y="18" width="4" height="64" rx="1.5" fill="#2BA6CB" />
      <circle cx="20" cy="34" r="6" fill="#3B4249" stroke="#111" strokeWidth="1.5" />
      <circle cx="20" cy="56" r="2.6" fill="#525B64" />
      <circle cx="15" cy="61" r="2.6" fill="#525B64" />
      <circle cx="25" cy="61" r="2.6" fill="#525B64" />
      <circle cx="20" cy="66" r="2.6" fill="#525B64" />

      {/* Right magnetic Joy-Con (matte charcoal with coral accent) */}
      <path
        d="M144 14 H156 C168 14, 174 22, 174 34 V66 C174 78, 168 86, 156 86 H144 V14 Z"
        fill="#24292E"
        stroke="#1A2320"
        strokeWidth="2.5"
      />
      <rect x="143" y="18" width="4" height="64" rx="1.5" fill="#E35D43" />
      <circle cx="160" cy="58" r="6" fill="#3B4249" stroke="#111" strokeWidth="1.5" />
      <circle cx="160" cy="29" r="2.6" fill="#525B64" />
      <circle cx="155" cy="34" r="2.6" fill="#525B64" />
      <circle cx="165" cy="34" r="2.6" fill="#525B64" />
      <circle cx="160" cy="39" r="2.6" fill="#525B64" />
      <rect x="155" y="71" width="6" height="6" rx="1.5" fill="#E35D43" />

      {/* Center 8-inch Console Tablet */}
      <rect
        x="37"
        y="12"
        width="106"
        height="76"
        rx="4"
        fill="#161B19"
        stroke="#1A2320"
        strokeWidth="2.5"
      />
      {/* Vibrant Screen Display */}
      <rect x="43" y="18" width="94" height="64" rx="3" fill="#1F3B4D" />
      <path d="M43 60 Q70 46 95 58 T137 54 V82 H43 Z" fill="#1B4D3E" />
      <circle cx="118" cy="32" r="7" fill="#F2B84B" />
      {/* Bold "2" emblem on screen */}
      <rect x="52" y="25" width="32" height="16" rx="4" fill="rgba(255,255,255,0.16)" />
      <text
        x="68"
        y="37"
        textAnchor="middle"
        fill="#FAF8F3"
        fontSize="11"
        fontWeight="800"
        fontFamily="monospace"
      >
        SW2
      </text>
    </svg>
  );
}

export function HotDogSpriteSvg({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.65)}
      viewBox="0 0 36 24"
      fill="none"
      aria-hidden="true"
    >
      {/* Back bun */}
      <rect
        x="3"
        y="6"
        width="30"
        height="13"
        rx="6.5"
        fill="#E5B26B"
        stroke="#6B421B"
        strokeWidth="1.5"
      />
      {/* Frankfurter sausage */}
      <rect
        x="1"
        y="8"
        width="34"
        height="7"
        rx="3.5"
        fill="#C45B3E"
        stroke="#632616"
        strokeWidth="1.4"
      />
      {/* Front bun highlight */}
      <path
        d="M5 14.5 C12 17, 24 17, 31 14.5"
        stroke="#F4D092"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Mustard squiggle */}
      <path
        d="M5 11.5 Q9 9 13 11.5 T21 11.5 T29 11.5"
        stroke="#F7C948"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function SmallHoardIconSvg({
  type,
  size = 28,
}: {
  type: HoardItemType;
  size?: number;
}) {
  switch (type) {
    case "costco_hotdog":
      return <HotDogSpriteSvg size={size} />;
    case "coffee":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M9 10 H23 L21 27 H11 Z" fill="#FFFFFF" stroke="#1A2320" strokeWidth="1.8" />
          <path d="M10 15 H22 L21.4 21 H10.6 Z" fill="#9A7B3E" />
          <rect x="7" y="7" width="18" height="3.5" rx="1.5" fill="#1B4D3E" stroke="#1A2320" strokeWidth="1.4" />
          <path d="M13 4 Q14 2 15 4 M18 4 Q19 2 20 4" stroke="#9A7B3E" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "groceries":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M11 10 C11 5, 21 5, 21 10" stroke="#1B4D3E" strokeWidth="2" />
          <rect x="6" y="10" width="20" height="18" rx="3" fill="#4A7C59" stroke="#1A2320" strokeWidth="1.7" />
          <circle cx="13" cy="10" r="3" fill="#C45B3E" />
          <path d="M17 7 L20 10 H15 Z" fill="#E6B84D" />
          <path d="M11 18 H21" stroke="#EFF5F1" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "takeout":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M7 13 H25 L23 27 H9 Z" fill="#FAF8F3" stroke="#1A2320" strokeWidth="1.7" />
          <path d="M7 13 L11 8 H21 L25 13 Z" fill="#E4DDD0" stroke="#1A2320" strokeWidth="1.7" />
          <circle cx="16" cy="20" r="3.2" fill="#C45B3E" />
          <path d="M19 6 L25 10" stroke="#9A7B3E" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "clothing":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M11 6 L6 10 L9 14 L11 12 V26 H21 V12 L23 14 L26 10 L21 6 C19 8, 13 8, 11 6 Z"
            fill="#C45B3E"
            stroke="#1A2320"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "fuel":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="8" y="8" width="15" height="19" rx="2.5" fill="#3F5563" stroke="#1A2320" strokeWidth="1.7" />
          <rect x="11" y="11" width="9" height="6" rx="1" fill="#EFF5F1" />
          <path d="M23 12 L26 15 V23 C26 24.5, 24 24.5, 23 23" stroke="#1A2320" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "subscription":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="5" y="8" width="22" height="16" rx="3" fill="#1B4D3E" stroke="#1A2320" strokeWidth="1.7" />
          <path d="M14 12 L20 16 L14 20 Z" fill="#FAF8F3" />
        </svg>
      );
    case "experience":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M4 11 H28 V14 A2 2 0 0 0 28 18 V21 H4 V18 A2 2 0 0 0 4 14 Z"
            fill="#E6B84D"
            stroke="#1A2320"
            strokeWidth="1.7"
          />
          <path d="M12 11 V21" stroke="#1A2320" strokeDasharray="2 2" strokeWidth="1.5" />
          <circle cx="20" cy="16" r="2.2" fill="#C45B3E" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="6" y="9" width="20" height="17" rx="2.5" fill="#D5B88B" stroke="#1A2320" strokeWidth="1.7" />
          <path d="M6 15 H26 M16 9 V26" stroke="#8C6D46" strokeWidth="1.8" />
        </svg>
      );
  }
}

export function SavingsChestSvg({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none" aria-label="Savings Treasure Vault">
      <ellipse cx="44" cy="77" rx="32" ry="6" fill="rgba(26,35,32,0.12)" />
      {/* Gold coin pile behind open lid */}
      <circle cx="32" cy="36" r="7" fill="#E8B948" stroke="#8A6114" strokeWidth="1.8" />
      <circle cx="44" cy="33" r="8" fill="#F4C95D" stroke="#8A6114" strokeWidth="1.8" />
      <circle cx="56" cy="37" r="7" fill="#E8B948" stroke="#8A6114" strokeWidth="1.8" />
      {/* Open Chest Lid */}
      <path
        d="M16 32 C16 17, 72 17, 72 32 Z"
        fill="#1B4D3E"
        stroke="#1A2320"
        strokeWidth="2.2"
      />
      {/* Chest Base */}
      <rect
        x="16"
        y="38"
        width="56"
        height="34"
        rx="5"
        fill="#246350"
        stroke="#1A2320"
        strokeWidth="2.2"
      />
      {/* Brass Bands & Lock */}
      <rect x="25" y="38" width="6" height="34" fill="#E8B948" stroke="#1A2320" strokeWidth="1.5" />
      <rect x="57" y="38" width="6" height="34" fill="#E8B948" stroke="#1A2320" strokeWidth="1.5" />
      <rect x="39" y="34" width="10" height="12" rx="2.5" fill="#F4C95D" stroke="#1A2320" strokeWidth="1.8" />
      <circle cx="44" cy="40" r="2" fill="#1A2320" />
    </svg>
  );
}

interface HoardVisualProps {
  userName: string | null;
  avatarStyle: string;
  avatarColor: string;
  hourlyNetPayCents: number;
  monthKey: string;
  totalSavedCents: number;
  transactions: HoardTransactionInput[];
  onRefresh: () => Promise<void>;
}

export function HoardVisual({
  userName,
  avatarStyle,
  avatarColor,
  hourlyNetPayCents,
  monthKey,
  totalSavedCents,
  transactions,
  onRefresh,
}: HoardVisualProps) {
  const [timeframe, setTimeframe] = useState<"year" | "month">("year");
  const [viewMode, setViewMode] = useState<"pile" | "compact">("pile");
  const [showAvatarDrawer, setShowAvatarDrawer] = useState(false);
  const [pendingStyle, setPendingStyle] = useState(avatarStyle || "explorer");
  const [pendingColor, setPendingColor] = useState(avatarColor || "#1B4D3E");
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [selectedClusterType, setSelectedClusterType] =
    useState<HoardItemType | null>(null);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editType, setEditType] = useState<HoardItemType>("general");
  const [editLabel, setEditLabel] = useState("");
  const [editQty, setEditQty] = useState("1");
  const [savingTx, setSavingTx] = useState(false);

  const filteredTransactions = useMemo(() => {
    if (timeframe === "year") return transactions;
    return transactions.filter((tx) => tx.date.slice(0, 7) === monthKey);
  }, [transactions, timeframe, monthKey]);

  const clusters = useMemo(
    () => buildHoardClusters(filteredTransactions),
    [filteredTransactions]
  );

  const selectedCluster: HoardCluster | null = useMemo(
    () => clusters.find((c) => c.type === selectedClusterType) || null,
    [clusters, selectedClusterType]
  );

  const totalItemsCount = clusters.reduce((s, c) => s + c.totalQuantity, 0);
  const totalSpentCents = clusters.reduce((s, c) => s + c.totalSpentCents, 0);

  async function saveAvatarSettings(newStyle: string, newColor: string) {
    setSavingAvatar(true);
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarStyle: newStyle, avatarColor: newColor }),
      });
      if (res.ok) {
        await onRefresh();
        setShowAvatarDrawer(false);
      }
    } finally {
      setSavingAvatar(false);
    }
  }

  function startEditTx(tx: HoardTransactionInput) {
    const type =
      tx.hoardItemType && tx.hoardItemType in HOARD_CATALOG
        ? (tx.hoardItemType as HoardItemType)
        : "general";
    setEditingTxId(tx.id);
    setEditType(type);
    setEditLabel(tx.hoardItemLabel || HOARD_CATALOG[type].label);
    setEditQty(String(tx.hoardQuantity || 1));
  }

  async function saveTxHoardTag(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTxId) return;
    setSavingTx(true);
    try {
      const res = await fetch(`/api/transactions/${editingTxId}/reflection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoardItemType: editType,
          hoardItemLabel: editLabel,
          hoardQuantity: Math.max(1, parseInt(editQty || "1", 10)),
        }),
      });
      if (res.ok) {
        setEditingTxId(null);
        await onRefresh();
      }
    } finally {
      setSavingTx(false);
    }
  }

  const hotdogCluster = clusters.find((c) => c.type === "costco_hotdog");
  const switchCluster = clusters.find((c) => c.type === "switch_2");
  const steamCluster = clusters.find((c) => c.type === "steam_game");
  const otherClusters = clusters.filter(
    (c) =>
      c.type !== "costco_hotdog" &&
      c.type !== "switch_2" &&
      c.type !== "steam_game"
  );

  return (
    <section className="hoard-stage" aria-label="Your Visual Purchase Hoard">
      {/* Top Stage Header & Controls */}
      <div className="hoard-header">
        <div>
          <div className="hoard-kicker">
            <Sparkles size={14} /> Where Every Dollar Actually Went
          </div>
          <h2 className="hoard-title">
            {userName ? `${userName.split(" ")[0]}’s` : "Your"} Spend &amp; Savings Hoard
          </h2>
          <p className="hoard-sub">
            Instead of dry spreadsheets, every swipe stacks the literal things
            you bought right beneath your avatar. Click any pile to inspect or
            re-tag it.
          </p>
        </div>

        <div className="hoard-controls">
          <div className="hoard-toggle-group" role="group" aria-label="Timeframe">
            <button
              type="button"
              className={`hoard-toggle-btn ${timeframe === "year" ? "active" : ""}`}
              onClick={() => setTimeframe("year")}
            >
              <Calendar size={14} /> Full Year (YTD)
            </button>
            <button
              type="button"
              className={`hoard-toggle-btn ${timeframe === "month" ? "active" : ""}`}
              onClick={() => setTimeframe("month")}
            >
              This Month
            </button>
          </div>

          <div className="hoard-toggle-group" role="group" aria-label="Display mode">
            <button
              type="button"
              className={`hoard-toggle-btn ${viewMode === "pile" ? "active" : ""}`}
              onClick={() => setViewMode("pile")}
            >
              <Layers size={14} /> Every Item
            </button>
            <button
              type="button"
              className={`hoard-toggle-btn ${viewMode === "compact" ? "active" : ""}`}
              onClick={() => setViewMode("compact")}
            >
              Stacks
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setPendingStyle(avatarStyle || "explorer");
              setPendingColor(avatarColor || "#1B4D3E");
              setShowAvatarDrawer((v) => !v);
            }}
          >
            <Palette size={14} /> Customize Avatar
          </button>
        </div>
      </div>

      {/* Inline Avatar Customizer */}
      {showAvatarDrawer && (
        <div className="avatar-customizer">
          <div className="avatar-customizer-preview">
            <CharacterAvatarSvg style={pendingStyle} color={pendingColor} size={86} />
          </div>
          <div className="avatar-customizer-controls">
            <div>
              <div className="field-label" style={{ marginBottom: 6 }}>
                Character Persona
              </div>
              <div className="chip-row">
                {AVATAR_STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    className={`chip-btn ${pendingStyle === st.id ? "selected" : ""}`}
                    onClick={() => setPendingStyle(st.id)}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="field-label" style={{ marginBottom: 6 }}>
                Jacket Color
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    aria-label={c.name}
                    onClick={() => setPendingColor(c.hex)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "999px",
                      background: c.hex,
                      border:
                        pendingColor === c.hex
                          ? "3px solid #1A2320"
                          : "2px solid #FFFFFF",
                      boxShadow: "0 0 0 1px #CFC5B3",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={savingAvatar}
                onClick={() => saveAvatarSettings(pendingStyle, pendingColor)}
              >
                {savingAvatar ? "Saving..." : "Save Avatar"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAvatarDrawer(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Pedestal + Savings Chest Twin Anchor */}
      <div className="hoard-pedestal-row">
        <div className="hoard-avatar-card">
          <div className="hoard-avatar-wrap">
            <CharacterAvatarSvg
              style={avatarStyle}
              color={avatarColor}
              size={108}
            />
          </div>
          <div className="hoard-pedestal-base">
            <span className="hoard-pedestal-name">
              {userName || "Mindful Spender"}
            </span>
            <span className="hoard-pedestal-stats mono-num">
              {totalItemsCount.toLocaleString()} items · {formatCents(totalSpentCents)} spent
            </span>
          </div>
        </div>

        <div className="hoard-vs-divider" aria-hidden="true">
          <span>vs.</span>
        </div>

        <div className="hoard-treasure-card">
          <SavingsChestSvg size={86} />
          <div>
            <div className="hoard-treasure-label">
              <Coins size={14} /> Kept Savings Treasure
            </div>
            <div className="hoard-treasure-value mono-num">
              {formatCents(totalSavedCents)}
            </div>
            <div className="hoard-treasure-hint">
              10-yr invested value:{" "}
              <strong className="mono-num">
                {formatCents(calcTenYearOpportunityCents(totalSavedCents))}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Visual Hoard Arena */}
      {clusters.length === 0 ? (
        <div className="surface-oat" style={{ textAlign: "center", padding: 32 }}>
          No purchases in this timeframe yet. Use the{" "}
          <strong>Simulate Live Card Swipe</strong> tool below to add hot dogs,
          a Switch 2, Steam games, or coffee to your hoard!
        </div>
      ) : (
        <div className="hoard-arena-grid">
          {/* 1. Costco Hot Dogs Mega Pile */}
          {hotdogCluster && (
            <button
              type="button"
              className="hoard-zone hoard-zone-wide"
              onClick={() => setSelectedClusterType(hotdogCluster.type)}
            >
              <div className="hoard-zone-head">
                <div>
                  <span className="hoard-count-pill mono-num">
                    {hotdogCluster.totalQuantity}× {hotdogCluster.pluralLabel}
                  </span>
                  <div className="hoard-zone-sub">
                    Every hot dog you bought rendered below your avatar
                  </div>
                </div>
                <span className="hoard-price-tag mono-num">
                  {formatCents(hotdogCluster.totalSpentCents)}
                </span>
              </div>

              {viewMode === "pile" ? (
                <div className="hotdog-pile-canvas" aria-label={`${hotdogCluster.totalQuantity} hot dogs`}>
                  {Array.from({
                    length: Math.min(200, hotdogCluster.totalQuantity),
                  }).map((_, idx) => {
                    const tilt = ((idx * 17) % 21) - 10;
                    const lift = (idx * 7) % 5;
                    return (
                      <span
                        key={idx}
                        className="hoard-sprite-item"
                        style={{
                          transform: `rotate(${tilt}deg) translateY(${lift}px)`,
                        }}
                      >
                        <HotDogSpriteSvg size={26} />
                      </span>
                    );
                  })}
                  {hotdogCluster.totalQuantity > 200 && (
                    <span className="hoard-overflow-badge mono-num">
                      +{hotdogCluster.totalQuantity - 200} more
                    </span>
                  )}
                </div>
              ) : (
                <div className="hoard-compact-row">
                  <HotDogSpriteSvg size={54} />
                  <span className="mono-num" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                    × {hotdogCluster.totalQuantity}
                  </span>
                </div>
              )}
            </button>
          )}

          {/* 2. Switch 2 Hardware Pedestal */}
          {switchCluster && (
            <button
              type="button"
              className="hoard-zone hoard-zone-hardware"
              onClick={() => setSelectedClusterType(switchCluster.type)}
            >
              <div className="hoard-zone-head">
                <div>
                  <span className="hoard-count-pill mono-num">
                    {switchCluster.totalQuantity}×{" "}
                    {switchCluster.totalQuantity === 1
                      ? switchCluster.label
                      : switchCluster.pluralLabel}
                  </span>
                  <div className="hoard-zone-sub">Flagship Console Purchase</div>
                </div>
                <span className="hoard-price-tag mono-num">
                  {formatCents(switchCluster.totalSpentCents)}
                </span>
              </div>

              <div className="hardware-pedestal">
                {Array.from({
                  length: Math.min(4, switchCluster.totalQuantity),
                }).map((_, idx) => (
                  <div key={idx} className="hardware-item">
                    <Switch2ConsoleSvg width={156} />
                  </div>
                ))}
              </div>
            </button>
          )}

          {/* 3. Steam Game Artwork Shelf */}
          {steamCluster && (
            <button
              type="button"
              className="hoard-zone hoard-zone-steam"
              onClick={() => setSelectedClusterType(steamCluster.type)}
            >
              <div className="hoard-zone-head">
                <div>
                  <span className="hoard-count-pill hoard-pill-steam mono-num">
                    {steamCluster.totalQuantity}× Steam Game Artwork
                  </span>
                  <div className="hoard-zone-sub">
                    Digital library shelf ·{" "}
                    {calcWorkHours(
                      steamCluster.totalSpentCents,
                      hourlyNetPayCents
                    )}{" "}
                    of work
                  </div>
                </div>
                <span className="hoard-price-tag mono-num">
                  {formatCents(steamCluster.totalSpentCents)}
                </span>
              </div>

              <div className="steam-shelf">
                {Array.from({
                  length:
                    viewMode === "pile"
                      ? Math.min(12, Math.max(1, steamCluster.totalQuantity))
                      : Math.min(4, Math.max(1, steamCluster.totalQuantity)),
                }).map((_, idx) => {
                  const cover = STEAM_COVERS[idx % STEAM_COVERS.length];
                  return (
                    <div key={idx} className="steam-case">
                      <div className="steam-case-header">STEAM</div>
                      <Image
                        src={cover.src}
                        alt={cover.title}
                        width={120}
                        height={150}
                        className="steam-case-art"
                      />
                    </div>
                  );
                })}
                {steamCluster.totalQuantity > (viewMode === "pile" ? 12 : 4) && (
                  <span className="hoard-overflow-badge mono-num">
                    +{steamCluster.totalQuantity - (viewMode === "pile" ? 12 : 4)} titles
                  </span>
                )}
              </div>
            </button>
          )}

          {/* 4. Remaining Everyday Hoard Piles (Coffee, Groceries, Takeout, Apparel, etc.) */}
          {otherClusters.map((cluster) => {
            const visibleLimit = viewMode === "pile" ? 36 : 1;
            const visibleCount = Math.min(visibleLimit, cluster.totalQuantity);

            return (
              <button
                key={cluster.type}
                type="button"
                className="hoard-zone"
                onClick={() => setSelectedClusterType(cluster.type)}
              >
                <div className="hoard-zone-head">
                  <div>
                    <span className="hoard-count-pill mono-num">
                      {cluster.totalQuantity}×{" "}
                      {cluster.totalQuantity === 1
                        ? cluster.label
                        : cluster.pluralLabel}
                    </span>
                  </div>
                  <span className="hoard-price-tag mono-num">
                    {formatCents(cluster.totalSpentCents)}
                  </span>
                </div>

                <div className="small-pile-canvas">
                  {Array.from({ length: visibleCount }).map((_, idx) => {
                    const tilt = ((idx * 13) % 15) - 7;
                    return (
                      <span
                        key={idx}
                        className="hoard-sprite-item"
                        style={{ transform: `rotate(${tilt}deg)` }}
                      >
                        <SmallHoardIconSvg
                          type={cluster.type}
                          size={viewMode === "pile" ? 30 : 48}
                        />
                      </span>
                    );
                  })}
                  {cluster.totalQuantity > visibleLimit && (
                    <span className="hoard-overflow-badge mono-num">
                      +{cluster.totalQuantity - visibleLimit}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Interactive Cluster Inspector & Re-tagger Modal */}
      {selectedCluster && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setSelectedClusterType(null);
            setEditingTxId(null);
          }}
        >
          <div
            className="modal-panel"
            style={{ maxWidth: 620, maxHeight: "88vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.35rem" }}>
                  {selectedCluster.totalQuantity}×{" "}
                  {selectedCluster.totalQuantity === 1
                    ? selectedCluster.label
                    : selectedCluster.pluralLabel}
                </h3>
                <p style={{ fontSize: "0.86rem", color: "var(--ink-secondary)", marginTop: 4 }}>
                  Total spent:{" "}
                  <strong className="mono-num">
                    {formatCents(selectedCluster.totalSpentCents)}
                  </strong>{" "}
                  ·{" "}
                  {calcWorkHours(
                    selectedCluster.totalSpentCents,
                    hourlyNetPayCents
                  )}{" "}
                  of work ·{" "}
                  <strong className="mono-num">
                    {formatCents(
                      calcTenYearOpportunityCents(selectedCluster.totalSpentCents)
                    )}
                  </strong>{" "}
                  10-yr invested value
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label="Close hoard inspector"
                onClick={() => {
                  setSelectedClusterType(null);
                  setEditingTxId(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedCluster.transactions.map((tx) => (
                <div key={tx.id} className="tx-row">
                  <div className="tx-header">
                    <div>
                      <div className="tx-merchant">{tx.merchantName}</div>
                      <div className="tx-meta">
                        {new Date(tx.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        · {tx.hoardQuantity || 1}× {tx.hoardItemLabel || selectedCluster.label}
                        {tx.envelope ? ` · ${tx.envelope.name}` : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="mono-num" style={{ fontWeight: 700 }}>
                        {formatCents(tx.amountCents)}
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ marginTop: 4 }}
                        onClick={() => startEditTx(tx)}
                      >
                        <Edit3 size={13} /> Edit Hoard Item
                      </button>
                    </div>
                  </div>

                  {editingTxId === tx.id && (
                    <form
                      onSubmit={saveTxHoardTag}
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px solid var(--border-sand)",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 80px auto",
                        gap: 8,
                        alignItems: "end",
                      }}
                    >
                      <div className="field-group">
                        <label className="field-label">Visual Type</label>
                        <select
                          className="field-select"
                          value={editType}
                          onChange={(e) => {
                            const nextType = e.target.value as HoardItemType;
                            setEditType(nextType);
                            setEditLabel(HOARD_CATALOG[nextType].label);
                          }}
                        >
                          {Object.values(HOARD_CATALOG).map((entry) => (
                            <option key={entry.type} value={entry.type}>
                              {entry.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field-group">
                        <label className="field-label">Custom Label</label>
                        <input
                          type="text"
                          className="field-input"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                        />
                      </div>
                      <div className="field-group">
                        <label className="field-label">Qty</label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          className="field-input"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={savingTx}
                      >
                        <Tag size={13} /> {savingTx ? "Saving" : "Save"}
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
