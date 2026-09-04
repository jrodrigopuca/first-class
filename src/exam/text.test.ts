import { describe, expect, it } from "vitest";
import { countWords, expandContractions, normalize, wordsOf } from "./text";

/*
 * Estas reglas las comparten tres juegos. Un error acá se propaga a los
 * tres a la vez, que es exactamente el motivo por el que la capa existe
 * y también el motivo por el que tiene sus propios tests.
 */

describe("normalize", () => {
  it("baja a minúscula y colapsa espacios", () => {
    expect(normalize("  Was   CALLED off ")).toBe("was called off");
  });

  it("saca la puntuación", () => {
    expect(normalize("looks after?")).toBe("looks after");
  });
});

describe("expandContractions", () => {
  it("separa las contracciones regulares", () => {
    expect(expandContractions("haven't")).toBe("have not");
    expect(expandContractions("they're")).toBe("they are");
    expect(expandContractions("we'll")).toBe("we will");
  });

  it("resuelve las irregulares que no siguen el patrón", () => {
    expect(expandContractions("won't")).toBe("will not");
    expect(expandContractions("cannot")).toBe("can not");
  });
});

describe("countWords", () => {
  it("cuenta una contracción como dos palabras, igual que Cambridge", () => {
    expect(countWords("haven't been to")).toBe(4);
  });

  it("cuenta igual la forma larga y la contraída", () => {
    expect(countWords("had not studied")).toBe(countWords("hadn't studied"));
  });

  it("cuenta cero en una cadena vacía", () => {
    expect(countWords("   ")).toBe(0);
  });
});

describe("wordsOf", () => {
  it("incluye la forma escrita y la expandida", () => {
    const words = wordsOf("hadn't studied");

    expect(words.has("not")).toBe(true);
    expect(words.has("had")).toBe(true);
    expect(words.has("studied")).toBe(true);
  });
});
