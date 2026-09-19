import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { generateReceiptMedia } from "./infrai_media.js";
import { decidePaymentRisk } from "./risk_policy.js";

export const paymentEventSchema = z.object({
  requestId: z.string().uuid(),
  eventId: z.string().min(1).max(80).regex(/^[A-Za-z0-9_-]+$/),
  accountRef: z.string().min(1).max(80),
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  merchant: z.string().min(1).max(120),
  occurredAt: z.string().datetime(),
  crossBorder: z.boolean()
}).strict();

export type PaymentRequest = z.infer<typeof paymentEventSchema>;

export type ReceiptRecord = {
  requestId: string;
  eventId: string;
  action: "approve" | "review";
  reasons: string[];
  imagePath: string;
  notification: string;
};

export async function processPaymentReceipt(
  input: PaymentRequest,
  outputDir = "receipts"
): Promise<ReceiptRecord> {
  await mkdir(outputDir, { recursive: true });
  const recordPath = join(outputDir, `${input.requestId}.json`);

  try {
    return JSON.parse(await readFile(recordPath, "utf8")) as ReceiptRecord;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const decision = decidePaymentRisk(input);
  const media = await generateReceiptMedia(input, decision, input.requestId);
  const imagePath = join(outputDir, `${input.requestId}.png`);
  const record: ReceiptRecord = {
    requestId: input.requestId,
    eventId: input.eventId,
    action: decision.action,
    reasons: decision.reasons,
    imagePath,
    notification: media.notification
  };

  await writeFile(imagePath, media.imageBytes, { flag: "wx" }).catch(async (error: NodeJS.ErrnoException) => {
    if (error.code !== "EEXIST") throw error;
  });
  await writeFile(recordPath, JSON.stringify(record, null, 2), { flag: "wx" }).catch(async (error: NodeJS.ErrnoException) => {
    if (error.code !== "EEXIST") throw error;
  });
  return record;
}
