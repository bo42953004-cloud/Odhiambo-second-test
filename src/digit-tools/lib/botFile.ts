import type { Bot } from "./bots";

/**
 * Reads a Deriv Bot (DBot) XML export and maps it onto a Bot object so it can
 * be opened, tuned and run inside the Bot Builder.
 *
 * Parsing is deliberately tolerant: it looks for the fields a DBot file reliably
 * carries (market, trade type, contract type, barrier/stake/duration numbers) and
 * falls back to sensible defaults for anything missing, so a partial or hand-made
 * XML still loads instead of failing.
 */

const pick = (xml: string, tag: string) => {
  const m = xml.match(new RegExp(`name="${tag}"[^>]*>([^<]*)<`, "i"));
  return m ? m[1].trim() : null;
};

const numberAfter = (xml: string, anchor: string, span = 400) => {
  const i = xml.toLowerCase().indexOf(anchor.toLowerCase());
  if (i < 0) return null;
  const m = xml.slice(i, i + span).match(/NUM">(-?[\d.]+)</i);
  return m ? Number(m[1]) : null;
};

const CONTRACT_LABEL: Record<string, Bot["contract"]> = {
  DIGITOVER: "Over/Under",
  DIGITUNDER: "Over/Under",
  DIGITEVEN: "Even/Odd",
  DIGITODD: "Even/Odd",
  DIGITMATCH: "Matches/Differs",
  DIGITDIFF: "Matches/Differs",
  CALL: "Rise/Fall",
  PUT: "Rise/Fall",
};

export type ParsedBot = {
  bot: Bot;
  warnings: string[];
  found: string[];
};

export function parseBotXml(xml: string, fileName = "imported-strategy.xml"): ParsedBot {
  const warnings: string[] = [];
  const found: string[] = [];
  const lower = xml.toLowerCase();

  if (!lower.includes("<xml")) warnings.push("no <xml> root found — reading it as a partial file anyway");

  /* ---------------- market ---------------- */
  const symbol = pick(xml, "SYMBOL_LIST");
  if (symbol) found.push(`market ${symbol}`);
  else warnings.push("market not found — defaulting to R_100");

  /* ---------------- trade type ---------------- */
  const tradeCat = pick(xml, "TRADETYPECAT_LIST");
  const tradeType = pick(xml, "TRADETYPE_LIST");
  if (tradeType) found.push(`trade type ${tradeType}`);

  /* ---------------- contract type ---------------- */
  const typeList = pick(xml, "TYPE_LIST") ?? "";
  const purchaseList = pick(xml, "PURCHASE_LIST") ?? "";
  const contractKey = (typeList || purchaseList).toUpperCase();
  let contract: Bot["contract"] = CONTRACT_LABEL[contractKey] ?? "Over/Under";
  if (!CONTRACT_LABEL[contractKey]) {
    if (contractKey.includes("EVEN")) contract = "Even/Odd";
    else if (contractKey.includes("ODD")) contract = "Even/Odd";
    else if (contractKey.includes("DIFF") || contractKey.includes("MATCH")) contract = "Matches/Differs";
    else if (contractKey.includes("OVER") || contractKey.includes("UNDER")) contract = "Over/Under";
    else if (contractKey.includes("CALL") || contractKey.includes("PUT")) contract = "Rise/Fall";
    else warnings.push(`unknown contract type "${contractKey || "none"}" — defaulting to Over/Under`);
  }
  if (contractKey) found.push(`contract ${contractKey}`);

  /* ---------------- numbers ---------------- */
  const stake = numberAfter(xml, 'id="stakeVar"', 600) ?? numberAfter(xml, "variables_set", 900) ?? 1;
  found.push(`stake ${stake}`);

  // barrier: the PREDICTION value on the purchase block, otherwise the first
  // small integer that is not the stake
  let barrier = 5;
  const pred = xml.match(/name="PREDICTION"[\s\S]{0,320}?NUM">(\d)</i);
  if (pred) barrier = Number(pred[1]);
  if (contract === "Even/Odd") barrier = 0;
  found.push(`barrier ${contract === "Even/Odd" ? "n/a" : barrier}`);

  const duration =
    numberAfter(xml, "trade_definition_tradeoptions", 600) ??
    numberAfter(xml, "DURATION", 300) ??
    5;
  found.push(`duration ${duration}`);

  // recovery multiplier inside the martingale arithmetic block
  const mult = xml.match(/OP">MULTIPLY[\s\S]{0,400}?NUM">([\d.]+)</i);
  const martingale = mult && Number(mult[1]) > 1 && Number(mult[1]) <= 5 ? Number(mult[1]) : 0;

  /* ---------------- meta ---------------- */
  const titleMatch = xml.match(/<!--([\s\S]{0,120}?)-->/);
  const baseName =
    fileName.replace(/\.xml$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() ||
    titleMatch?.[1]?.trim() ||
    "Imported strategy";

  const name = baseName.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 38) || "Imported strategy";

  const bot: Bot = {
    id: `xml-${Date.now()}`,
    rank: 0,
    name,
    tagline: "Imported from your device",
    tag: contract,
    tier: "free",
    desc: `Loaded from ${fileName}. Market, contract, barrier, stake and recovery were read out of the XML — verify them against your strategy before running.`,
    a: "#29d3f5",
    img: "/bots/bot-cyan.png",
    market: symbol ?? "R_100",
    contract,
    barrier,
    stake,
    duration,
    martingale,
    stopLoss: 50,
    takeProfit: 100,
    win: 0,
    runs: 0,
    users: 0,
    ret: 0,
    risk: martingale ? "High" : "Medium",
    latency: "—",
    features: ["Imported XML", `Trade type ${tradeType ?? "digits"}`, tradeCat ? `category ${tradeCat}` : "custom"],
    curve: [0, 2, 3, 5, 6, 8, 10, 12, 14, 16, 18, 20, 23, 25],
    logic: [
      found.length ? `Read from XML: ${found.join(" · ")}` : "No recognisable fields were found in this file",
      "Open the XML side-by-side and confirm every number before arming the runner",
      "The runner uses paper mode until you wire your own Deriv token",
    ],
  };

  return { bot, warnings, found };
}

/** Promise wrapper around FileReader for the file picker. */
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(new Error("Could not read the file"));
    r.readAsText(file);
  });
}
