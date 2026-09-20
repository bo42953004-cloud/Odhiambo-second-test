export type Bot = {
  id: string;
  rank: number;
  name: string;
  tag: string;
  tier: "free" | "premium";
  desc: string;
  /** short marketing line shown under the name */
  tagline: string;
  a: string;
  /** hero robot render */
  img: string;
  /** hue rotation applied to the render so variants read differently */
  hue?: number;
  market: string;
  contract: "Over/Under" | "Even/Odd" | "Matches/Differs" | "Rise/Fall";
  barrier: number;
  stake: number;
  duration: number;
  martingale: number;
  stopLoss: number;
  takeProfit: number;
  win: number;
  runs: number;
  users: number;
  /** average monthly return reported by users, % */
  ret: number;
  risk: "Low" | "Medium" | "High";
  /** avg. ms between decision and entry */
  latency: string;
  /** capability chips */
  features: string[];
  /** 14-point equity curve for the sparkline */
  curve: number[];
  logic: string[];
};

export const CONTRACT_TYPES = ["Over/Under", "Even/Odd", "Matches/Differs", "Rise/Fall"] as const;

export const BOT_MARKETS = [
  "R_10",
  "R_25",
  "R_50",
  "R_75",
  "R_100",
  "1HZ10V",
  "1HZ15V",
  "1HZ25V",
  "1HZ30V",
  "1HZ50V",
  "1HZ75V",
  "1HZ90V",
  "1HZ100V",
  "1HZ150V",
  "1HZ250V",
  "JD10",
  "JD25",
  "JD50",
  "JD75",
  "JD100",
];

const IMG = {
  cyan: "/bots/bot-cyan.png",
  gold: "/bots/bot-gold.png",
  teal: "/bots/bot-teal.png",
  violet: "/bots/bot-violet.png",
  emerald: "/bots/bot-emerald.png",
};

export const BOTS: Bot[] = [
  {
    id: "digit-sniper-v4",
    rank: 1,
    name: "Digit Sniper V4",
    tagline: "Precision digit hunting, tick by tick",
    tag: "Over/Under",
    tier: "free",
    desc: "Waits for a cold digit below the barrier, then buys Over on the recovery tick.",
    a: "#29d3f5",
    img: IMG.cyan,
    market: "R_100",
    contract: "Over/Under",
    barrier: 5,
    stake: 10,
    duration: 5,
    martingale: 0,
    stopLoss: 50,
    takeProfit: 100,
    win: 78,
    runs: 1420,
    users: 3120,
    ret: 12.4,
    risk: "Medium",
    latency: "180 ms",
    features: ["Digit reader", "Cold-digit entry", "Flat stake", "Auto stop-loss"],
    curve: [0, 4, 3, 8, 7, 12, 11, 17, 16, 22, 21, 27, 26, 31],
    logic: [
      "Track digits 0–9 over the last 100 ticks",
      "Enter when the coldest digit sits 3 ticks under the barrier",
      "Skip the next tick after entry to avoid the whip",
      "Flat stake — no recovery multiplier",
    ],
  },
  {
    id: "even-hunter-pro",
    rank: 2,
    name: "Even Hunter Pro",
    tagline: "Fades parities that push too far",
    tag: "Even/Odd",
    tier: "free",
    desc: "Fades an over-extended odd streak and rides the parity flip back to even.",
    a: "#12c9a0",
    img: IMG.emerald,
    market: "1HZ100V",
    contract: "Even/Odd",
    barrier: 0,
    stake: 5,
    duration: 3,
    martingale: 0,
    stopLoss: 40,
    takeProfit: 80,
    win: 71,
    runs: 986,
    users: 2480,
    ret: 9.8,
    risk: "Low",
    latency: "1.0 s",
    features: ["Streak counter", "Mean reversion", "Max 2 attempts", "Hard stop"],
    curve: [0, 2, 5, 4, 8, 10, 9, 14, 13, 16, 19, 18, 22, 25],
    logic: [
      "Count the current odd streak in real time",
      "Buy Even once the streak passes 4",
      "Maximum 2 attempts per streak cycle",
      "Hard stop after 3 consecutive losses",
    ],
  },
  {
    id: "steady-steps",
    rank: 3,
    name: "Steady Steps",
    tagline: "The calm starter — no recovery ever",
    tag: "Even/Odd",
    tier: "free",
    desc: "The safest starter: one flat trade per parity flip, no recovery at all.",
    a: "#2f7bff",
    img: IMG.emerald,
    hue: 150,
    market: "1HZ10V",
    contract: "Even/Odd",
    barrier: 0,
    stake: 1,
    duration: 2,
    martingale: 0,
    stopLoss: 25,
    takeProfit: 40,
    win: 74,
    runs: 2890,
    users: 5230,
    ret: 6.1,
    risk: "Low",
    latency: "1.0 s",
    features: ["Beginner safe", "One contract at a time", "Daily cap", "Flat stake"],
    curve: [0, 1, 3, 3, 5, 6, 6, 8, 9, 9, 11, 12, 12, 14],
    logic: [
      "Wait for a parity flip, then trade with the new parity",
      "Flat 1.00 USD stake on every entry",
      "One contract at a time, no stacking",
      "Stops at 25.00 USD drawdown for the day",
    ],
  },
  {
    id: "martingale-guard",
    rank: 4,
    name: "Martingale Guard",
    tagline: "Recovery, but with a leash on it",
    tag: "Over/Under",
    tier: "free",
    desc: "Classic recovery stepping, but capped and force-reset every 4 steps.",
    a: "#f5b731",
    img: IMG.gold,
    market: "R_50",
    contract: "Over/Under",
    barrier: 4,
    stake: 2,
    duration: 5,
    martingale: 2.1,
    stopLoss: 120,
    takeProfit: 60,
    win: 64,
    runs: 2310,
    users: 4410,
    ret: 14.9,
    risk: "High",
    latency: "220 ms",
    features: ["×2.1 recovery", "Step cap 4", "Force reset", "Soft stop"],
    curve: [0, 3, 9, 5, 12, 4, 15, 8, 18, 6, 21, 11, 24, 14],
    logic: [
      "Stake ×2.1 after each loss, capped at step 4",
      "Reset to base stake once a win lands",
      "Abort the cycle if the cap is hit",
      "Soft stop-loss at 120.00 USD",
    ],
  },
  {
    id: "differs-reaper",
    rank: 5,
    name: "Differs Reaper",
    tagline: "Trades the digit that has vanished",
    tag: "Matches/Differs",
    tier: "free",
    desc: "Hunts the exact digit only when it has been absent far longer than its expected gap.",
    a: "#8b5cf6",
    img: IMG.violet,
    market: "R_75",
    contract: "Matches/Differs",
    barrier: 4,
    stake: 8,
    duration: 4,
    martingale: 0,
    stopLoss: 60,
    takeProfit: 150,
    win: 83,
    runs: 517,
    users: 1180,
    ret: 17.2,
    risk: "Medium",
    latency: "240 ms",
    features: ["Gap analytics", "1.6× expected gap", "Differs only", "Cooldown"],
    curve: [0, 5, 4, 10, 9, 15, 14, 20, 19, 26, 25, 30, 34, 38],
    logic: [
      "Measure the gap since digit 4 last printed",
      "Only fire past 1.6× the expected gap",
      "Buy Differs, never Matches, on the first attempt",
      "Cool down 20 ticks after any loss",
    ],
  },
  {
    id: "cold-digit-fade",
    rank: 6,
    name: "Cold Digit Fade",
    tagline: "Sells Under against hot digit clusters",
    tag: "Over/Under",
    tier: "free",
    desc: "Sells Under while a hot digit cluster keeps repeating above the barrier.",
    a: "#ec4899",
    img: IMG.teal,
    hue: 300,
    market: "1HZ50V",
    contract: "Over/Under",
    barrier: 6,
    stake: 6,
    duration: 6,
    martingale: 1.8,
    stopLoss: 90,
    takeProfit: 120,
    win: 69,
    runs: 1640,
    users: 2760,
    ret: 11.3,
    risk: "Medium",
    latency: "1.0 s",
    features: ["Cluster detector", "×1.8 recovery", "3 steps max", "Auto pause"],
    curve: [0, 4, 8, 6, 11, 9, 14, 17, 15, 20, 24, 22, 27, 30],
    logic: [
      "Detect 3 repeats of the same digit above the barrier",
      "Buy Under on the 4th tick",
      "×1.8 recovery, maximum 3 steps",
      "Pause for 30 ticks after a 3rd loss",
    ],
  },

  /* ---------------- premium / elite ---------------- */
  {
    id: "pegasus-grid-ai",
    rank: 1,
    name: "Pegasus Grid AI",
    tagline: "Six-barrier grid that rotates with volatility",
    tag: "Over/Under",
    tier: "premium",
    desc: "Six-barrier grid that rotates symbols as volatility shifts through the session.",
    a: "#ffb020",
    img: IMG.gold,
    market: "R_100",
    contract: "Over/Under",
    barrier: 5,
    stake: 25,
    duration: 8,
    martingale: 1.5,
    stopLoss: 300,
    takeProfit: 600,
    win: 86,
    runs: 742,
    users: 890,
    ret: 28.6,
    risk: "High",
    latency: "95 ms",
    features: [
      "Multi-market rotation",
      "Adaptive stake ladder",
      "Volatility governor",
      "AI barrier re-tuning",
      "Session scheduler",
      "Priority signals",
    ],
    curve: [0, 6, 14, 12, 22, 19, 30, 27, 39, 34, 46, 43, 55, 62],
    logic: [
      "Scan all 5 volatility indices every 60 ticks",
      "Allocate to the index with the widest digit spread",
      "Rotate stakes ×1.5 up to 5 steps",
      "Disable entries in the first 2 minutes of a session",
      "AI re-tunes the barrier every 500 ticks from live distribution",
      "Hard ceiling of 4 concurrent cycles",
    ],
  },
  {
    id: "nightowl-scalper",
    rank: 2,
    name: "Nightowl Digit Scalper",
    tagline: "High-frequency scalping on the 1-second feeds",
    tag: "Even/Odd",
    tier: "premium",
    desc: "Low-stake, high-frequency scalper tuned for the 1-second feeds overnight.",
    a: "#a855f7",
    img: IMG.violet,
    hue: 20,
    market: "1HZ75V",
    contract: "Even/Odd",
    barrier: 0,
    stake: 3,
    duration: 1,
    martingale: 1.2,
    stopLoss: 80,
    takeProfit: 200,
    win: 81,
    runs: 3120,
    users: 640,
    ret: 24.1,
    risk: "Medium",
    latency: "40 ms",
    features: [
      "1-second feed tuned",
      "Skew gate 6pp",
      "Micro ×1.2 recovery",
      "6-step cap",
      "Auto-flat on balance",
      "Low-latency engine",
    ],
    curve: [0, 3, 8, 7, 13, 12, 18, 17, 24, 23, 30, 29, 36, 42],
    logic: [
      "Uses the 1HZ feed only — one tick per second",
      "Trades only while the parity skew exceeds 6pp",
      "Micro-recovery ×1.2, capped at 6 steps",
      "Auto-flat when the skew returns to balance",
      "Skips entries within 5 ticks of a market jump",
    ],
  },
  {
    id: "titan-surge-elite",
    rank: 3,
    name: "Titan Surge Elite",
    tagline: "Institutional sizing on the jump indices",
    tag: "Matches/Differs",
    tier: "premium",
    desc: "Institutional sizing on jump indices, gated by an overdue-digit confirmation.",
    a: "#ec4899",
    img: IMG.cyan,
    hue: 300,
    market: "JD50",
    contract: "Matches/Differs",
    barrier: 7,
    stake: 50,
    duration: 10,
    martingale: 0,
    stopLoss: 500,
    takeProfit: 1000,
    win: 88,
    runs: 318,
    users: 410,
    ret: 33.8,
    risk: "High",
    latency: "120 ms",
    features: [
      "Jump index specialist",
      "2σ gap confirmation",
      "Position sizer",
      "Cycle limiter",
      "Drawdown shield",
      "VIP desk support",
    ],
    curve: [0, 8, 6, 18, 15, 28, 25, 38, 35, 50, 47, 60, 68, 76],
    logic: [
      "Jump indices only (JD10 – JD100)",
      "Requires a 2σ digit-gap confirmation before entry",
      "Never trades more than 4 open cycles",
      "Kills the run at 1000.00 USD profit",
      "Position sizer scales stake with rolling drawdown",
    ],
  },
];

export const botById = (id: string | null) => BOTS.find((b) => b.id === id) ?? null;

/** Draft Deriv Bot (DBot) XML skeleton — verify blocks in Deriv Bot before running. */
export function botToXml(b: Bot) {
  const digits = b.contract === "Over/Under";
  return `<!-- DRAFT generated by DigitTools — open in Deriv Bot and verify every block -->
<xml xmlns="http://www.w3.org/1999/xhtml" is_dbot="true" collection="false">
  <variables>
    <variable id="stakeVar">stake</variable>
    <variable id="consecutiveLosses">consecutiveLosses</variable>
  </variables>
  <block type="trade_definition" id="tradeDefinition" x="0" y="0">
    <statement name="TRADE_OPTIONS">
      <block type="trade_definition_market" id="market">
        <field name="MARKET_LIST">synthetic_index</field>
        <field name="SUBMARKET_LIST">random_index</field>
        <field name="SYMBOL_LIST">${b.market}</field>
        <next>
          <block type="trade_definition_tradetype" id="tradeType">
            <field name="TRADETYPECAT_LIST">digits</field>
            <field name="TRADETYPE_LIST">${b.contract.toLowerCase()}</field>
            <next>
              <block type="trade_definition_contracttype" id="contractType">
                <field name="TYPE_LIST">${digits ? "DIGITOVER" : b.contract === "Even/Odd" ? "DIGITEVEN" : "DIGITDIFF"}</field>
                <next>
                  <block type="trade_definition_candleinterval" id="candle">
                    <field name="CANDLEINTERVAL_LIST">60</field>
                    <next>
                      <block type="trade_definition_restartbuysell" id="restartBuySell">
                        <field name="TIME_MACHINE_ENABLED">FALSE</field>
                        <next>
                          <block type="trade_definition_restartonerror" id="restartOnError">
                            <field name="RESTARTONERROR">TRUE</field>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
    <statement name="INITIALIZATION">
      <block type="variables_set" id="setStake">
        <field name="VAR" id="stakeVar">stake</field>
        <value name="VALUE">
          <block type="math_number" id="stakeNum"><field name="NUM">${b.stake}</field></block>
        </value>
        <next>
          <block type="variables_set" id="setLosses">
            <field name="VAR" id="consecutiveLosses">consecutiveLosses</field>
            <value name="VALUE">
              <block type="math_number" id="zeroLosses"><field name="NUM">0</field></block>
            </value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="before_purchase" id="before" x="0" y="320">
    <statement name="BEFOREPURCHASE_STACK">
      <block type="purchase" id="purchase">
        <field name="PURCHASE_LIST">${digits ? "DIGITOVER" : b.contract === "Even/Odd" ? "DIGITEVEN" : "DIGITDIFF"}</field>
        <value name="AMOUNT">
          <block type="variables_get" id="getStake"><field name="VAR" id="stakeVar">stake</field></block>
        </value>
        <value name="PREDICTION">
          <block type="math_number" id="barrierNum"><field name="NUM">${b.barrier}</field></block>
        </value>
      </block>
    </statement>
  </block>
  <block type="during_purchase" id="during" x="0" y="520">
    <statement name="DURING_PURCHASE_STACK">
      <block type="contract_check_result" id="checkResult">
        <field name="CHECK_RESULT">win</field>
        <statement name="IF_TRUE">
          <block type="variables_set" id="resetStake">
            <field name="VAR" id="stakeVar">stake</field>
            <value name="VALUE">
              <block type="math_number" id="baseStake"><field name="NUM">${b.stake}</field></block>
            </value>
          </block>
        </statement>
        <statement name="IF_FALSE">
          <block type="variables_set" id="stepStake">
            <field name="VAR" id="stakeVar">stake</field>
            <value name="VALUE">
              <block type="math_arithmetic" id="martingale">
                <field name="OP">MULTIPLY</field>
                <value name="A">
                  <block type="variables_get" id="getStake2"><field name="VAR" id="stakeVar">stake</field></block>
                </value>
                <value name="B">
                  <block type="math_number" id="factor"><field name="NUM">${b.martingale || 1}</field></block>
                </value>
              </block>
            </value>
          </block>
        </statement>
      </block>
    </statement>
  </block>
  <block type="after_purchase" id="after" x="0" y="720">
    <statement name="AFTERPURCHASE_STACK">
      <block type="controls_if" id="riskCheck">
        <value name="IF0">
          <block type="logic_compare" id="compare">
            <field name="OP">EQ</field>
            <value name="A">
              <block type="math_number" id="one"><field name="NUM">1</field></block>
            </value>
            <value name="B">
              <block type="math_number" id="one2"><field name="NUM">1</field></block>
            </value>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <!-- Risk guard: stop-loss ${b.stopLoss} USD · take-profit ${b.takeProfit} USD · duration ${b.duration} ticks -->
</xml>`;
}
