export type PaymentEvent = {
  eventId: string;
  accountRef: string;
  amountMinor: number;
  currency: string;
  merchant: string;
  occurredAt: string;
  crossBorder: boolean;
};

export type RiskDecision = {
  action: "approve" | "review";
  reasons: string[];
};

const REVIEW_AMOUNT_MINOR = 100_000;

export function decidePaymentRisk(event: PaymentEvent): RiskDecision {
  const reasons: string[] = [];
  if (event.amountMinor >= REVIEW_AMOUNT_MINOR) reasons.push("high_amount");
  if (event.crossBorder) reasons.push("cross_border");

  return reasons.length > 0
    ? { action: "review", reasons }
    : { action: "approve", reasons: [] };
}
