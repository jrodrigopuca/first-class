import { describe, expect, it } from "vitest";
import {
  countWords,
  findSubmissionIssue,
  isCorrect,
  markAnswer,
  normalize,
  SUBMISSION_ISSUE,
} from "./grading";
import type { KeyWordQuestion } from "./types";

const question: KeyWordQuestion = {
  id: "modal-necessity-need-not-book",
  family: "modal-necessity",
  category: "modal",
  label: "Ausencia de obligación",
  level: 1,
  original: "It isn't necessary for you to book a table.",
  keyWord: "NEED",
  gapped: "You ___ a table.",
  answers: ["do not need to book", "need not book"],
  halves: [
    ["do not need", "to book"],
    ["need not", "book"],
  ],
  explanation: "",
};

describe("countWords", () => {
  it("cuenta una contracción como dos palabras, igual que Cambridge", () => {
    // Si contaras con un split simple darías 3 y aceptarías respuestas
    // que en el examen valen cero por pasarse del máximo.
    expect(countWords("haven't been to")).toBe(4);
  });

  it("expande las contracciones irregulares", () => {
    expect(countWords("won't go")).toBe(3);
    expect(countWords("cannot have taken")).toBe(4);
    expect(countWords("can't have taken")).toBe(4);
  });

  it("cuenta las formas largas igual que sus contracciones", () => {
    expect(countWords("had not studied")).toBe(countWords("hadn't studied"));
  });

  it("ignora los espacios de más y la puntuación", () => {
    expect(countWords("  looks   after.  ")).toBe(2);
  });

  it("cuenta cero en una respuesta vacía", () => {
    expect(countWords("   ")).toBe(0);
  });
});

describe("normalize", () => {
  it("baja a minúscula y colapsa los espacios", () => {
    expect(normalize("  Was   CALLED off ")).toBe("was called off");
  });

  it("saca la puntuación del final", () => {
    expect(normalize("looks after?")).toBe("looks after");
  });
});

describe("findSubmissionIssue", () => {
  it("acepta una respuesta que cumple todas las reglas", () => {
    expect(findSubmissionIssue(question, "need not book")).toBeNull();
  });

  it("rechaza una respuesta vacía", () => {
    expect(findSubmissionIssue(question, "   ")).toBe(SUBMISSION_ISSUE.EMPTY);
  });

  it("rechaza menos de dos palabras", () => {
    expect(findSubmissionIssue(question, "need")).toBe(SUBMISSION_ISSUE.TOO_FEW);
  });

  it("rechaza más de cinco palabras", () => {
    expect(findSubmissionIssue(question, "do not really need to book")).toBe(
      SUBMISSION_ISSUE.TOO_MANY,
    );
  });

  it("cuenta las contracciones al medir el máximo", () => {
    // "don't need to book a table" son 5 tokens escritos pero 6 palabras.
    expect(findSubmissionIssue(question, "don't need to book a")).toBe(
      SUBMISSION_ISSUE.TOO_MANY,
    );
  });

  it("rechaza una respuesta que no incluye la palabra clave", () => {
    expect(findSubmissionIssue(question, "do not have to book")).toBe(
      SUBMISSION_ISSUE.MISSING_KEY_WORD,
    );
  });

  it("reconoce la palabra clave escondida dentro de una contracción", () => {
    const withNot: KeyWordQuestion = {
      ...question,
      keyWord: "NOT",
      answers: ["had not"],
      halves: [["had", "not"]],
    };

    expect(findSubmissionIssue(withNot, "hadn't studied")).toBeNull();
  });

  it("valida antes de corregir: una respuesta inválida no llega a puntuarse", () => {
    // Pasarse de palabras no es "responder mal", y por eso el juego nunca
    // llama a submit() cuando esto devuelve un problema.
    const tooLong = "do not really need to book";

    expect(findSubmissionIssue(question, tooLong)).not.toBeNull();
    expect(isCorrect(question, tooLong)).toBe(false);
  });
});

describe("isCorrect", () => {
  it("acepta cualquiera de las respuestas válidas", () => {
    expect(isCorrect(question, "do not need to book")).toBe(true);
    expect(isCorrect(question, "need not book")).toBe(true);
  });

  it("no le importan las mayúsculas ni los espacios de más", () => {
    expect(isCorrect(question, "  NEED   Not Book  ")).toBe(true);
  });

  it("rechaza una respuesta que no está en la lista", () => {
    expect(isCorrect(question, "need not to book")).toBe(false);
  });
});

describe("isCorrect con contracciones", () => {
  it("acepta la forma contraída de una respuesta guardada expandida", () => {
    // Bug real: "don't need to book" se marcaba mal porque la respuesta
    // guardada es "do not need to book". Para Cambridge son la misma.
    expect(isCorrect(question, "don't need to book")).toBe(true);
    expect(isCorrect(question, "needn't book")).toBe(true);
  });
});

describe("markAnswer: dos puntos por ítem, como en el examen", () => {
  it("da 2 a la respuesta exacta, con cualquiera de las válidas", () => {
    expect(markAnswer(question, "do not need to book").marks).toBe(2);
    expect(markAnswer(question, "need not book").marks).toBe(2);
  });

  it("da 1 si solo la primera mitad está bien", () => {
    const marking = markAnswer(question, "do not need booking");
    expect(marking.marks).toBe(1);
    expect(marking.firstHalf).toBe(true);
    expect(marking.secondHalf).toBe(false);
  });

  it("da 1 si solo la segunda mitad está bien", () => {
    const marking = markAnswer(question, "did not need to book");
    expect(marking.marks).toBe(1);
    expect(marking.firstHalf).toBe(false);
    expect(marking.secondHalf).toBe(true);
  });

  it("da 1, no 2, si las dos mitades están pero sobra algo en el medio", () => {
    expect(markAnswer(question, "do not need really to book").marks).toBe(1);
  });

  it("da 0 si no acierta ninguna mitad", () => {
    expect(markAnswer(question, "must not book it").marks).toBe(0);
  });

  it("devuelve la respuesta aceptada más cercana, para explicar qué faltó", () => {
    expect(markAnswer(question, "need not booking").closest).toEqual(["need not", "book"]);
  });

  it("isCorrect solo es verdadero con 2 de 2: lo parcial vuelve en el repaso espaciado", () => {
    expect(isCorrect(question, "do not need booking")).toBe(false);
  });
});
