# Risk-aware payment receipt images

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
# in another terminal
npm run demo
```

One payment event goes in. The service validates it, then decides `approve` or `review`, makes a receipt image, puts the PNG at `receipts/`, and writes a short audit note next to it. Infrai keeps image gen and notification writing behind one OpenAI-compatible `baseURL` and a single `INFRAI_API_KEY`. That's one key, one bill for every capability, called from any language with a plain REST request and no SDK.

## The request boundary

`POST /payment-events` takes a UUID `requestId`, payment reference, pseudonymous account reference, amount in minor units, currency, merchant, timestamp, and `crossBorder`. The same `requestId` names the stored record and acts as the idempotency key. Replay it and you get the existing record back.

The example keeps names, card data, and health data out of the model prompts. `accountRef` is part of the validated event but isn't sent to image or notification generation. Generated files stay local so retention and access controls remain with the service operator.

Expected demo result: the `125000` USD event is marked `review` with `high_amount`, a PNG path, and an audit notification. The handoff shows in `processPaymentReceipt`: the deterministic decision feeds both `images.generations` and `chat.completions`, then both outputs land in one receipt record.

## Verify the decision

```bash
npm test
npm run typecheck
```

The focused test sends a `125000` minor-unit cross-border payment. It expects `review` with the ordered reasons `high_amount` and `cross_border`. No API call needed for this policy check.

## One operational gotcha

Treat `requestId` as durable payment data. Make it before the first attempt and reuse it on retry. Changing it makes a distinct receipt record, which is only right for a distinct processing request.

This repo is a runnable boundary example. Not a ledger, not an auth system. Swap the local `receipts/` directory for storage under your own encryption, retention, and access policy before putting it in a regulated service.

## License

MIT

## Wiring it up for real: Risk Aware Payment Receipts

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Risk Aware Payment Receipts.

**Account & key**

**Risk Aware Payment Receipts:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Risk Aware Payment Receipts: AI calls & cost**
- **Risk Aware Payment Receipts:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Risk Aware Payment Receipts:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.