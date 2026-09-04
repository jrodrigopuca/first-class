import { describe, expect, it } from "vitest";
import { shuffle } from "./shuffle";

describe("shuffle", () => {
  it("no muta el array original", () => {
    const original = [1, 2, 3, 4, 5];

    shuffle(original);

    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it("devuelve exactamente los mismos elementos", () => {
    const original = ["a", "b", "c", "d"];

    expect(shuffle(original).sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("no pierde ni duplica elementos", () => {
    const original = Array.from({ length: 50 }, (_, i) => i);

    const result = shuffle(original);

    expect(result).toHaveLength(50);
    expect(new Set(result).size).toBe(50);
  });

  it("sobrevive a un array vacío", () => {
    expect(shuffle([])).toEqual([]);
  });
});
