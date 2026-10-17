import { describe, it, expect } from "vitest";
import { uuidv7 } from "./uuidv7";

const UUID_V7_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuidv7", () => {
  it("generates a well-formed UUIDv7 string", () => {
    expect(uuidv7()).toMatch(UUID_V7_PATTERN);
  });

  it("generates unique values", () => {
    const values = new Set(Array.from({ length: 1000 }, () => uuidv7()));
    expect(values.size).toBe(1000);
  });

  it("sorts lexicographically by creation time", async () => {
    const first = uuidv7();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = uuidv7();

    expect(second > first).toBe(true);
  });
});
