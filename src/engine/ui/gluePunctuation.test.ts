import { describe, expect, it } from "vitest";
import { splitLeadingPunctuation } from "./gluePunctuation";

describe("splitLeadingPunctuation", () => {
  it("separa la puntuación con la que arranca el tramo", () => {
    expect(splitLeadingPunctuation(", and our neighbours")).toEqual([",", " and our neighbours"]);
    expect(splitLeadingPunctuation(". The trend began")).toEqual([".", " The trend began"]);
  });

  it("toma varios signos seguidos, como un punto después de una comilla", () => {
    expect(splitLeadingPunctuation("'. Then")).toEqual(["'.", " Then"]);
    expect(splitLeadingPunctuation("?) and")).toEqual(["?)", " and"]);
  });

  it("no toca un tramo que arranca con espacio o con una palabra", () => {
    expect(splitLeadingPunctuation(" up beekeeping")).toEqual(["", " up beekeeping"]);
    expect(splitLeadingPunctuation("s were")).toEqual(["", "s were"]);
  });

  it("devuelve todo como puntuación si el tramo es solo puntuación", () => {
    expect(splitLeadingPunctuation(".")).toEqual([".", ""]);
  });
});
