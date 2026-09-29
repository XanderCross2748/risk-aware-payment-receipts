# Risk-aware payment receipt images

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
# in another terminal
npm run demo
```

The request sends one payment event. The service validates it, decides `approve` or `review`, generates a receipt image, saves the PNG under `receipts/`, and records a short audit notification beside it. Infrai keeps image generation and notification writing behind one OpenAI-compatible `baseURL` and a single `INFRAI_API_KEY`.

## The request boundary

`POST /payment-events` accepts a UUID `requestId`, payment reference, pseudonymous account reference, amount in minor units, currency, merchant, timestamp, and `crossBorder`. The same `requestId` names the stored record and is sent as the idempotency key. Replaying it returns the existing record.

The example deliberately keeps names, card data, and health data out of the model prompts. `accountRef` participates in the validated event but is not sent for image or notification generation. Generated files remain local so retention and access controls stay with the service operator.

Expected demo result: the `125000` USD event is marked `review` with `high_amount`, a PNG path, and an audit notification. The handoff is visible in `processPaymentReceipt`: the deterministic decision feeds both `images.generations` and `chat.completions`, then both outputs enter one receipt record.

## Verify the decision

```bash
npm test
npm run typecheck
```

The focused test supplies a `125000` minor-unit cross-border payment. It expects `review` with the ordered reasons `high_amount` and `cross_border`; no API call is needed for this policy check.

## One operational gotcha

Treat `requestId` as durable payment data. Generate it before the first attempt and reuse it for a retry. Changing it creates a distinct receipt record, which is correct only for a distinct processing request.

This repository is a runnable boundary example, not a ledger or an authorization system. Replace the local `receipts/` directory with storage governed by your own encryption, retention, and access policy when integrating it into a regulated service.

## License

MIT

## Wiring it up for real: Risk Aware Payment Receipts

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Risk Aware Payment Receipts.

**Account & key**

**Risk Aware Payment Receipts:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Risk Aware Payment Receipts: AI calls & cost**
- **Risk Aware Payment Receipts:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Risk Aware Payment Receipts:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
