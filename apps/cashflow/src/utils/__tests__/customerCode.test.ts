import { describe, expect, it } from "vitest";
import { matchCustomerCode } from "../customerCode";

describe("matchCustomerCode", () => {
  it("prefers an exact customer code", () => {
    expect(matchCustomerCode("630", ["0630", "630"])).toBe("630");
  });

  it("recovers a leading zero removed by Excel", () => {
    expect(matchCustomerCode("630", ["0630", "1001"])).toBe("0630");
  });

  it("rejects an ambiguous numeric fallback", () => {
    expect(matchCustomerCode("630", ["0630", "00630"])).toBeNull();
  });

  it("normalizes spreadsheet apostrophes and non-breaking spaces", () => {
    expect(matchCustomerCode("'KH\u00a0001", ["KH 001"])).toBe("KH 001");
  });
});
