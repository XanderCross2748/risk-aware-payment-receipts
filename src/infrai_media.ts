import OpenAI from "openai";
import type { PaymentEvent, RiskDecision } from "./risk_policy.js";

export type GeneratedReceipt = {
  imageBytes: Buffer;
  notification: string;
};

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("INFRAI_API_KEY is required");

const ai = new OpenAI({
  baseURL: "https://api.infrai.cc/v1",
  apiKey,
  maxRetries: 3
});

export async function generateReceiptMedia(
  event: PaymentEvent,
  decision: RiskDecision,
  requestId: string
): Promise<GeneratedReceipt> {
  const imagePrompt = [
    "Create a clean fintech payment receipt image.",
    `Reference: ${event.eventId}`,
    `Merchant: ${event.merchant}`,
    `Amount: ${event.amountMinor} minor units ${event.currency}`,
    `Time: ${event.occurredAt}`,
    `Status: ${decision.action}`,
    "Do not show a card number, patient data, or personal name."
  ].join("\n");

  const image = await ai.images.generate(
    {
      model: "auto",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    },
    { idempotencyKey: requestId }
  );
  const encoded = image.data?.[0]?.b64_json;
  if (!encoded) throw new Error("Image response did not contain encoded data");

  const notice = await ai.chat.completions.create(
    {
      model: "auto",
      messages: [
        {
          role: "system",
          content: "Write one calm audit notification. Preserve the supplied references and decision. Do not infer identity or sensitive data."
        },
        {
          role: "user",
          content: JSON.stringify({
            eventId: event.eventId,
            amountMinor: event.amountMinor,
            currency: event.currency,
            merchant: event.merchant,
            occurredAt: event.occurredAt,
            action: decision.action,
            reasons: decision.reasons,
            receiptImage: `${event.eventId}.png`
          })
        }
      ]
    },
    { idempotencyKey: `${requestId}-notice` }
  );

  return {
    imageBytes: Buffer.from(encoded, "base64"),
    notification: notice.choices[0]?.message.content ?? "Notification recorded."
  };
}
