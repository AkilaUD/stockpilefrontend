import type { FieldFailures } from "./auth";

/*
 * Client-side shadow of the RFQ field rules (the server is authoritative:
 * CreateRfqRequestValidator.cs / CreateRfqItemRequestValidator.cs in
 * Stockpile.Application/Procurement). Like lib/validation/auth.ts this is a UX
 * layer only — a 422 VALIDATION_FAILED envelope still lands on the fields —
 * and it exists so a form user sees the message before the round trip.
 *
 * Item field keys are dotted (`items.0.description`); the server speaks the
 * bracketed form (`items[0].categorySlug`) and the form normalises it through
 * `serverFieldKey`, so both vocabularies resolve to the same control.
 */

export type RfqValidationCode =
  | "titleRequired"
  | "itemDescriptionRequired"
  | "quantityInvalid"
  | "companyRequired";

export interface RfqItemValues {
  description: string;
  quantity: string;
  categorySlug: string;
  unitOfMeasureCode: string;
  specification: string;
}

export interface RfqFormValues {
  title: string;
  companyName: string;
  registrationNumber: string;
  website: string;
  deliveryLocationText: string;
  substitutionsAllowed: boolean;
  specialInstructions: string;
  expiryDays: string;
  items: RfqItemValues[];
}

type Translate = (key: RfqValidationCode) => string;

/** The client-side key for one item control; the server's `items[i].field` maps onto it. */
export function itemFieldKey(index: number, field: keyof RfqItemValues): string {
  return `items.${index}.${field}`;
}

/** Normalise a server field path (`items[0].categorySlug`, `company`) to a form control key. */
export function serverFieldKey(field: string): string {
  if (field === "company") return "companyName";
  return field.replace(/\[(\d+)\]/g, ".$1");
}

export function validateRfq(
  values: RfqFormValues,
  needsCompany: boolean,
  t: Translate,
): FieldFailures {
  const failing: FieldFailures = {};

  if (values.title.trim().length === 0) failing.title = t("titleRequired");
  if (needsCompany && values.companyName.trim().length === 0) failing.companyName = t("companyRequired");

  values.items.forEach((item, index) => {
    if (item.description.trim().length === 0) {
      failing[itemFieldKey(index, "description")] = t("itemDescriptionRequired");
    }
    const quantity = Number(item.quantity);
    if (item.quantity.trim().length === 0 || !Number.isFinite(quantity) || quantity <= 0) {
      failing[itemFieldKey(index, "quantity")] = t("quantityInvalid");
    }
  });

  return failing;
}
