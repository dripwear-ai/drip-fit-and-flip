import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CATEGORIES = ["top", "bottom", "layer", "shoes", "dress", "accessory"] as const;

const MODEL = "openai/gpt-6-astra" as const;

async function askJson<T>(content: Array<{ type: "input_text"; text: string } | { type: "input_image"; image_url: string; detail: "low" | "high" | "auto" }>, schemaName: string, schema: Record<string, unknown>): Promise<T> {
  const { generateResponse, GatewayError, PaymentRequiredError, RateLimitError } = await import("@lovable.dev/ai-gateway");
  try {
    const res = await generateResponse({
      model: MODEL,
      instructions:
        "You are Drip's fashion stylist: sharp, current, concise. Answer only with JSON that matches the schema.",
      input: [{ type: "message", role: "user", content }],
      text: { format: { type: "json_schema", name: schemaName, schema, strict: true } },
    });
    let text = "";
    for (const item of res.output ?? []) {
      if (item.type === "message") {
        for (const c of item.content) if (c.type === "output_text") text += c.text;
      }
    }
    if (!text) throw new Error("The stylist returned no answer.");
    return JSON.parse(text) as T;
  } catch (err) {
    if (err instanceof PaymentRequiredError) throw new Error("AI credits have run out for this workspace.");
    if (err instanceof RateLimitError) throw new Error("The stylist is busy — try again in a moment.");
    if (err instanceof GatewayError) {
      console.error("stylist gateway error", err.code, err.ids);
      throw new Error("The stylist couldn't answer right now.");
    }
    throw err;
  }
}

export type GarmentTags = {
  name: string;
  category: (typeof CATEGORIES)[number];
  colorName: string;
  colorHex: string;
  tags: string[];
};

export const tagGarment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        image: z
          .string()
          .max(1_500_000)
          .regex(/^data:image\/(jpeg|png|webp);base64,/),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<GarmentTags> => {
    return askJson<GarmentTags>(
      [
        {
          type: "input_text",
          text: "Identify the single main clothing item in this photo. Give a short catchy product-style name (2-4 words), its category, main colour name and hex, and 3 short style tags (fabric, fit, vibe). Return JSON.",
        },
        { type: "input_image", image_url: data.image, detail: "low" },
      ],
      "garment",
      {
        type: "object",
        additionalProperties: false,
        required: ["name", "category", "colorName", "colorHex", "tags"],
        properties: {
          name: { type: "string" },
          category: { type: "string", enum: [...CATEGORIES] },
          colorName: { type: "string" },
          colorHex: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
    );
  });

const itemSchema = z.object({
  id: z.string().max(64),
  name: z.string().max(80),
  category: z.enum(CATEGORIES),
  colorName: z.string().max(40),
  tags: z.array(z.string().max(40)).max(8),
});

const catalogSchema = z.object({
  id: z.string().max(64),
  name: z.string().max(80),
  category: z.string().max(40),
});

export type StyledOutfit = { title: string; itemIds: string[]; why: string; vibeScore: number };
export type MissingPiece = { catalogId: string; reason: string; unlocks: number };
export type StylistResult = { outfits: StyledOutfit[]; missing: MissingPiece[] };

export const styleOutfits = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        occasion: z.string().max(40),
        items: z.array(itemSchema).min(1).max(60),
        catalog: z.array(catalogSchema).max(40),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<StylistResult> => {
    const result = await askJson<StylistResult>(
      [
        {
          type: "input_text",
          text: [
            `Occasion: ${data.occasion}.`,
            `The user's wardrobe (use only these ids in outfits): ${JSON.stringify(data.items)}`,
            `Shop catalog (use only these ids for missing pieces): ${JSON.stringify(data.catalog)}`,
            "Build up to 3 distinct outfits from the wardrobe for this occasion. Each outfit should combine 2-4 items that make sense together (e.g. top + bottom + shoes, or dress + shoes, optionally a layer). Give each a punchy title, a one-sentence why, and a vibe score 70-99.",
            "Then pick 2-3 catalog items the wardrobe is missing that would unlock the most new outfits; give a short reason and an estimated number of new outfits unlocked (3-20). Return JSON.",
          ].join("\n"),
        },
      ],
      "stylist",
      {
        type: "object",
        additionalProperties: false,
        required: ["outfits", "missing"],
        properties: {
          outfits: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "itemIds", "why", "vibeScore"],
              properties: {
                title: { type: "string" },
                itemIds: { type: "array", items: { type: "string" } },
                why: { type: "string" },
                vibeScore: { type: "number" },
              },
            },
          },
          missing: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["catalogId", "reason", "unlocks"],
              properties: {
                catalogId: { type: "string" },
                reason: { type: "string" },
                unlocks: { type: "number" },
              },
            },
          },
        },
      },
    );
    const ids = new Set(data.items.map((i) => i.id));
    const catIds = new Set(data.catalog.map((c) => c.id));
    return {
      outfits: result.outfits
        .map((o) => ({ ...o, itemIds: o.itemIds.filter((id) => ids.has(id)) }))
        .filter((o) => o.itemIds.length >= 2)
        .slice(0, 3),
      missing: result.missing.filter((m) => catIds.has(m.catalogId)).slice(0, 3),
    };
  });
