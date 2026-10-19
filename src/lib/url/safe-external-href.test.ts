import { describe, expect, it } from "vitest";
import { safeExternalHref } from "./safe-external-href";

describe("safeExternalHref", () => {
  it("allows http and https absolute URLs", () => {
    expect(safeExternalHref("https://example.com/path")).toBe("https://example.com/path");
    expect(safeExternalHref("http://example.com")).toBe("http://example.com/");
  });

  it("rejects javascript, data, and relative values", () => {
    expect(safeExternalHref("javascript:alert(1)")).toBeNull();
    expect(safeExternalHref("data:text/html,<script>")).toBeNull();
    expect(safeExternalHref("/relative")).toBeNull();
    expect(safeExternalHref("")).toBeNull();
    expect(safeExternalHref(null)).toBeNull();
  });
});
