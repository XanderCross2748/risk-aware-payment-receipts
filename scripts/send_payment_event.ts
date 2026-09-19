const response = await fetch("http://localhost:3000/payment-events", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    requestId: "f06bbf40-c090-4bf1-a3c5-0e6bb72c4420",
    eventId: "pay_2026_0906_01",
    accountRef: "acct_pseudonymous_42",
    amountMinor: 125000,
    currency: "usd",
    merchant: "North Clinic Pharmacy",
    occurredAt: "2026-09-06T09:30:00.000Z",
    crossBorder: false
  })
});

console.log(response.status, await response.json());
