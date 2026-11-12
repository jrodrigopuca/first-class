import { describe, expect, it } from "vitest";
import { drawGaps, GAPS_PER_TEXT, parseGappedText } from "./gappedText";

const OK = "She decided to {take} up tennis. Then the group met again and {went} on.";

describe("parseGappedText", () => {
  it("parte el texto en tramos y devuelve los marcadores en orden", () => {
    const { paragraphs, markers } = parseGappedText([OK]);
    expect(markers).toEqual(["take", "went"]);
    expect(paragraphs[0]).toEqual([
      "She decided to ",
      { gap: 0 },
      " up tennis. Then the group met again and ",
      { gap: 1 },
      " on.",
    ]);
  });

  it("rechaza un hueco que abre una frase", () => {
    expect(() => parseGappedText(["She decided to {take} up tennis. {Then} it ended."])).toThrow(
      /abre una frase/,
    );
  });

  it("rechaza un hueco al principio del párrafo", () => {
    expect(() => parseGappedText(["{She} decided to stay."])).toThrow(/abre una frase/);
  });

  it("rechaza un hueco después de una cita que cierra frase", () => {
    expect(() => parseGappedText(["He said 'no.' {And} left the room quickly."])).toThrow(
      /abre una frase/,
    );
  });

  it("rechaza dos huecos demasiado cerca", () => {
    expect(() => parseGappedText(["She decided to {take} it {up} at once."])).toThrow(
      /palabras del anterior/,
    );
  });

  it("rechaza una llave suelta", () => {
    expect(() => parseGappedText(["She decided to {take up tennis."])).toThrow(/llave suelta/);
  });
});

describe("drawGaps", () => {
  it("nunca sortea el ejemplo y devuelve las posiciones ordenadas y sin repetir", () => {
    for (let i = 0; i < 50; i++) {
      const drawn = drawGaps(11);
      expect(drawn).toHaveLength(GAPS_PER_TEXT);
      expect(drawn).not.toContain(0);
      expect(new Set(drawn).size).toBe(drawn.length);
      expect(drawn).toEqual([...drawn].sort((a, b) => a - b));
      expect(Math.max(...drawn)).toBeLessThanOrEqual(10);
    }
  });

  it("no sortea siempre los mismos", () => {
    const seen = new Set(Array.from({ length: 50 }, () => drawGaps(11).join(",")));
    expect(seen.size).toBeGreaterThan(1);
  });
});
