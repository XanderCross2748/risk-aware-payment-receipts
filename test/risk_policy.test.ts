import assert from "node:assert/strict";
import test from "node:test";
import { decidePaymentRisk } from "../src/risk_policy.js";

test("routes a high-value cross-border payment to review with auditable reasons", () => {
  const decision = decidePaymentRisk({
    eventId: "pay_test_01",
    accountRef: "acct_test_01",
    amountMinor: 125000,
    currency: "USD",
    merchant: "North Clinic Pharmacy",
    occurredAt: "2026-09-06T09:30:00.000Z",
    crossBorder: true
  });

  assert.deepEqual(decision, {
    action: "review",
    reasons: ["high_amount", "cross_border"]
  });
});
