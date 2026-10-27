import { describe, expect, it } from "vitest";
import {
  computeSubtotal,
  parseLines,
  toRfqItems,
  type MaterialsLine,
} from "./materials-list";

function line(partial: Partial<MaterialsLine>): MaterialsLine {
  return {
    key: "k1",
    description: "Cement 50kg",
    specification: "",
    quantity: "",
    unitOfMeasureCode: "",
    categorySlug: "",
    ...partial,
  };
}

describe("computeSubtotal — honesty rules", () => {
  it("totals only public prices with a positive quantity", () => {
    const result = computeSubtotal([
      line({ priceState: "Public", priceAmount: 100, quantity: "3" }),
      line({ priceState: "Public", priceAmount: 50, quantity: "2" }),
    ]);
    expect(result.amount).toBe(400);
    expect(result.pricedLines).toBe(2);
    expect(result.porLines).toBe(0);
  });

  it("never prices a POR line as zero — it is counted and excluded", () => {
    const result = computeSubtotal([
      line({ priceState: "PriceOnRequest", priceAmount: null, quantity: "10" }),
      line({ priceState: "Public", priceAmount: 100, quantity: "1" }),
    ]);
    expect(result.amount).toBe(100);
    expect(result.porLines).toBe(1);
  });

  it("flags priced lines that still need a quantity", () => {
    const result = computeSubtotal([line({ priceState: "Public", priceAmount: 100, quantity: "" })]);
    expect(result.amount).toBe(0);
    expect(result.awaitingQuantity).toBe(1);
  });
});

describe("toRfqItems", () => {
  it("carries the SKU inside the specification (RFQ items have no product id)", () => {
    const items = toRfqItems([line({ sku: "STL-001", specification: "Grade 60", quantity: "12" })]);
    expect(items).toHaveLength(1);
    expect(items[0].specification).toBe("Grade 60 · SKU: STL-001");
    expect(items[0].quantity).toBe("12");
  });

  it("drops blank lines", () => {
    expect(toRfqItems([line({ description: "  " })])).toHaveLength(0);
  });
});

describe("parseLines", () => {
  it("round-trips stored lines and rejects garbage", () => {
    const stored = JSON.stringify([line({ sku: "CEM-1", quantity: "5" })]);
    const parsed = parseLines(stored);
    expect(parsed[0].sku).toBe("CEM-1");
    expect(parsed[0].quantity).toBe("5");
    expect(parseLines("not json")).toEqual([]);
    expect(parseLines(null)).toEqual([]);
  });
});
