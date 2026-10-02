import { z } from "zod";

/**
 * One charge line, named after the columns of the FinOps FOCUS specification in camelCase.
 * `billedCost` is FOCUS `BilledCost`, and so on. Every provider adapter produces this shape, so
 * an analyzer never reads a provider's own export format.
 *
 * This is the subset of FOCUS the analyzers use. Add a column here when an analyzer needs it.
 */
export const chargeCategorySchema = z.enum(["Usage", "Purchase", "Tax", "Credit", "Adjustment"]);
export type ChargeCategory = z.infer<typeof chargeCategorySchema>;

export const pricingCategorySchema = z.enum(["Standard", "Dynamic", "Committed", "Other"]);
export type PricingCategory = z.infer<typeof pricingCategorySchema>;

const name = z.string().min(1);
const cost = z.number().finite();
const instant = z.iso.datetime({ offset: true });

export const costRecordSchema = z
  .object({
    providerName: name,
    billingAccountId: name,
    subAccountId: name.optional(),
    /** Inclusive start of the period the charge covers, ISO 8601. */
    chargePeriodStart: instant,
    /** Exclusive end of the period the charge covers, ISO 8601. */
    chargePeriodEnd: instant,
    chargeCategory: chargeCategorySchema,
    chargeDescription: z.string().optional(),
    /** ISO 4217 code. Every cost on the record is in this currency. */
    billingCurrency: z.string().regex(/^[A-Z]{3}$/),
    /** What the invoice charges, after discounts. Negative for a credit. */
    billedCost: cost,
    /** The amortized cost, with upfront commitment purchases spread over their term. */
    effectiveCost: cost,
    /** The cost at the public on-demand price, before any discount. */
    listCost: cost.optional(),
    serviceName: name,
    serviceCategory: name.optional(),
    regionId: name.optional(),
    resourceId: name.optional(),
    resourceType: name.optional(),
    skuId: name.optional(),
    pricingCategory: pricingCategorySchema.optional(),
    consumedQuantity: z.number().finite().optional(),
    consumedUnit: name.optional(),
    commitmentDiscountId: name.optional(),
    tags: z.record(z.string(), z.string()).default({}),
  })
  .refine((record) => Date.parse(record.chargePeriodEnd) > Date.parse(record.chargePeriodStart), {
    path: ["chargePeriodEnd"],
    message: "chargePeriodEnd must be after chargePeriodStart",
  });

export type CostRecord = z.infer<typeof costRecordSchema>;
