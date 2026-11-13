export interface ResearchModule {
  slug: string;
  title: string;
  subtitle: string;
  citation: string;
  keyStat: string;
  statLabel: string;
  summary: string;
  howCreditCardsExploitIt: string;
  howTallywiseCountersIt: string;
  actionRule: string;
  promptQuestion: string;
}

export const RESEARCH_MODULES: ResearchModule[] = [
  {
    slug: "pain-of-paying",
    title: "The Anesthetized Pain of Paying",
    subtitle: "Why handing over cash hurts — and why plastic silences your natural brake",
    citation: "Zellermayer (1996); Prelec & Loewenstein, Marketing Science (1998)",
    keyStat: "12%–18%",
    statLabel: "higher supermarket spend with cards vs. cash (MIT study)",
    summary:
      "Behavioral economists discovered that parting with physical cash triggers a brief emotional discomfort — the 'pain of paying' — which acts as an internal self-regulation brake. Credit cards replace tangible bills leaving your hand with a frictionless plastic or phone tap, numbing that protective signal.",
    howCreditCardsExploitIt:
      "Because no cash visibly leaves your checking balance at the register, your brain registers the reward of the purchase immediately while muting the emotional cost.",
    howTallywiseCountersIt:
      "Every card swipe sends an instant push notification showing the exact envelope balance dropping in real time and moves that cash into your Credit Card Payment Reserve.",
    actionRule:
      "Before tapping your card for any non-essential item over $25, open the matching envelope first and look at the dollars remaining for the rest of the month.",
    promptQuestion:
      "Which spending category currently feels 'invisible' when you pay by card?",
  },
  {
    slug: "credit-card-premium",
    title: "The Credit Card Premium & Willingness to Pay",
    subtitle: "Why we consistently bid and tip more when paying on credit",
    citation: "Prelec & Simester, Marketing Letters (2001) — 'Always Leave Home Without It'",
    keyStat: "Up to 2×",
    statLabel: "higher willingness-to-pay for identical goods on credit vs. cash",
    summary:
      "In landmark MIT experiments with genuine financial stakes, participants instructed to pay by credit card bid up to twice as much for event tickets and 36% more for dining certificates compared to participants paying cash — even though liquidity wasn't constrained.",
    howCreditCardsExploitIt:
      "A high credit limit creates an illusion of purchasing power. Instead of asking 'Can I afford this from this month's budget?', our brains ask 'Will the card go through?'",
    howTallywiseCountersIt:
      "Tallywise hides your credit limit from daily decisions and anchors you to zero-based envelopes funded only by real take-home income after savings goals are funded first.",
    actionRule:
      "Never judge affordability by your card's available credit. Judge every purchase strictly by the remaining balance in its category envelope.",
    promptQuestion:
      "Have you ever justified a larger upgrade or tip because you put it on a card?",
  },
  {
    slug: "temporal-decoupling",
    title: "Temporal Decoupling & Bill Shock",
    subtitle: "Separating today's pleasure from a statement 30 days later",
    citation: "Soman (2001); Prelec & Loewenstein (1998)",
    keyStat: "30–45 days",
    statLabel: "delay between swipe pleasure and actual checking account outflow",
    summary:
      "Cash couples consumption and payment into one moment. Credit cards bundle dozens of separate decisions into one delayed monthly bill, eroding expenditure recall so consumers systematically underestimate how much they spent.",
    howCreditCardsExploitIt:
      "When the statement arrives weeks later, individual coffees, deliveries, and impulse buys blur together, causing 'statement shock' and partial minimum payments.",
    howTallywiseCountersIt:
      "Our automatic Credit Card Payment Reserve locks away the exact purchase amount from your budget the moment a transaction syncs — guaranteeing 100% full-statement payoff every month with $0 interest.",
    actionRule:
      "Tag every push alert within 24 hours as Planned, Essential, or Impulse while the context is still fresh.",
    promptQuestion:
      "What usually surprises you most when your monthly credit card statement closes?",
  },
  {
    slug: "contactless-spendception",
    title: "Contactless Frictionless 'Spendception'",
    subtitle: "How Apple Pay, Tap-to-Pay, and 1-click checkout hide micro-spending",
    citation: "Trütsch (2014); DNB Working Paper No. 760; Zu et al. (2024)",
    keyStat: "+8% to +10%",
    statLabel: "point-of-sale spending ratio jump after adopting contactless payments",
    summary:
      "Modern studies show that contactless cards and mobile wallets lower the pain of paying even further than chip-and-PIN cards. Eye-tracking and diary studies reveal that fast, stored-credential checkouts reduce price comparison and make frequent micro-transactions feel weightless.",
    howCreditCardsExploitIt:
      "Average US consumers now make ~16 credit card payments per month (Fed Diary of Consumer Payment Choice). Small $6–$18 taps on food delivery, coffee, and apps rarely trigger mental alarms.",
    howTallywiseCountersIt:
      "Tallywise translates every purchase into two tangible realities inside your push coaching: Hours of Take-Home Work and 10-Year Compounded Opportunity Cost.",
    actionRule:
      "Remove saved credit cards from 1-click shopping apps and food delivery wallets so you reintroduce a 15-second pause before buying.",
    promptQuestion:
      "Which 1-click or tap-to-pay habit quietly drains the most from your monthly budget?",
  },
  {
    slug: "rewards-illusion",
    title: "The Cashback & Points Illusion",
    subtitle: "Why chasing 2% rewards often causes a 15% overspend",
    citation: "Feinberg (1986); Behavioral Economics Mental Accounting Research",
    keyStat: "2% vs 15%",
    statLabel: "reward earned vs. typical unbudgeted card overspend",
    summary:
      "Cashback, points, and travel miles create a subtle psychological reversal: spending feels like 'earning.' Consumers routinely stretch a purchase or add an extra item to hit a sign-up bonus or earn 3× points — losing far more in principal than they gain in rewards.",
    howCreditCardsExploitIt:
      "Card issuers subsidize 1.5%–3% rewards using merchant fees and the 20%+ APR interest paid by borrowers who carry balances even a few months a year.",
    howTallywiseCountersIt:
      "Tallywise treats rewards strictly as bonus income *only* when your Credit Card Payment Reserve covers 100% of your balance and all spending stays inside envelope caps.",
    actionRule:
      "Calculate the net math: if an extra purchase wouldn't happen with cash, a 2% reward is actually a 98% loss.",
    promptQuestion:
      "What is one rule you will set so points or cashback never dictate a purchase?",
  },
];

export interface CoachingResult {
  status: "WITHIN_BUDGET" | "NEAR_LIMIT" | "OVER_BUDGET";
  title: string;
  body: string;
  coachingNote: string;
}

export function buildPurchaseCoaching(params: {
  merchantName: string;
  amountCents: number;
  envelopeName: string;
  allocatedCents: number;
  newSpentCents: number;
  hourlyNetPayCents: number;
  paymentChannel: string;
  savingsMonthlyTargetCents: number;
}): CoachingResult {
  const {
    merchantName,
    amountCents,
    envelopeName,
    allocatedCents,
    newSpentCents,
    hourlyNetPayCents,
    paymentChannel,
    savingsMonthlyTargetCents,
  } = params;

  const remainingCents = allocatedCents - newSpentCents;
  const pctUsed = allocatedCents > 0 ? Math.round((newSpentCents / allocatedCents) * 100) : 100;
  const amountStr = `$${(amountCents / 100).toFixed(2)}`;
  const remainingStr = `$${(Math.abs(remainingCents) / 100).toFixed(2)}`;
  const workHours =
    hourlyNetPayCents > 0
      ? amountCents / hourlyNetPayCents < 1
        ? `${Math.round((amountCents / hourlyNetPayCents) * 60)} min of work`
        : `${(amountCents / hourlyNetPayCents).toFixed(1)} hrs of work`
      : null;
  const tenYearValue = `$${((amountCents * Math.pow(1.07, 10)) / 100).toFixed(0)}`;

  const channelTip =
    paymentChannel === "online"
      ? "Online checkouts remove physical friction — verify this matched your plan."
      : "Card reserve locked aside so your statement stays 100% covered.";

  if (remainingCents < 0) {
    return {
      status: "OVER_BUDGET",
      title: `Over Budget: ${amountStr} at ${merchantName}`,
      body: `${envelopeName} is ${remainingStr} OVER budget (${pctUsed}% used). Rebalance from another envelope to protect your $${(savingsMonthlyTargetCents / 100).toFixed(0)} savings goal.`,
      coachingNote: `${workHours ? `Cost ${workHours} (${tenYearValue} in 10 yrs at 7%). ` : ""}Move ${remainingStr} from a discretionary envelope so your Credit Card Reserve stays 100% funded.`,
    };
  }

  if (pctUsed >= 75) {
    return {
      status: "NEAR_LIMIT",
      title: `Watch Limit: ${amountStr} at ${merchantName}`,
      body: `${envelopeName} has ${remainingStr} left (${pctUsed}% used). Card reserve updated (+${amountStr}).`,
      coachingNote: `${workHours ? `Equivalent to ${workHours}. ` : ""}Only ${remainingStr} remains in ${envelopeName} — pause non-essentials here until next month.`,
    };
  }

  return {
    status: "WITHIN_BUDGET",
    title: `Within Budget: ${amountStr} at ${merchantName}`,
    body: `${envelopeName} has ${remainingStr} left (${pctUsed}% used). +${amountStr} moved to Card Payment Reserve.`,
    coachingNote: `${workHours ? `${workHours} (${tenYearValue} 10-yr value). ` : ""}${channelTip}`,
  };
}
