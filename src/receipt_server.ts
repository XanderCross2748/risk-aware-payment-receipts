import { createServer } from "node:http";
import OpenAI from "openai";
import { ZodError } from "zod";
import { paymentEventSchema, processPaymentReceipt } from "./payment_receipt_service.js";

const port = Number(process.env.PORT ?? 3000);

const server = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json");
  if (request.method !== "POST" || request.url !== "/payment-events") {
    response.writeHead(404).end(JSON.stringify({ error: "Route not found" }));
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body = paymentEventSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const record = await processPaymentReceipt(body);
    response.writeHead(201).end(JSON.stringify(record));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      response.writeHead(400).end(JSON.stringify({ error: "Invalid payment event" }));
      return;
    }
    if (error instanceof OpenAI.APIError && error.status && error.status >= 400 && error.status < 500) {
      response.writeHead(error.status).end(JSON.stringify({ error: error.message }));
      return;
    }
    console.error(error);
    response.writeHead(502).end(JSON.stringify({ error: "Receipt generation was not completed" }));
  }
});

server.listen(port, () => console.log(`Receipt service listening on http://localhost:${port}`));
