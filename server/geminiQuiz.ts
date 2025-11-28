import { GoogleGenAI, Type } from "@google/genai";
import type { Question } from "../types";

const quizGenerationSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question_text: {
        type: Type.STRING,
        description: "クイズの問題文",
      },
      options: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: "4つの選択肢の配列",
      },
      correct_answer: {
        type: Type.INTEGER,
        description: "正解の選択肢を示す1から4の番号",
      },
    },
    required: ["question_text", "options", "correct_answer"],
  },
};

export interface GeminiQuizParams {
  transcript: string;
  questionCount?: number;
}

const buildPrompt = (transcript: string, questionCount: number) => `以下の文字起こしを基に、${questionCount}個の多肢選択式のクイズ問題を生成してください。各問題は、文字起こしの中の重要な概念の理解度を問うものにしてください。各問題には、選択肢を4つずつ用意してください。

文字起こし:
---
${transcript}
---
`;

const normalizeModelText = async (response: any) => {
  if (!response) {
    return "";
  }
  if (typeof response.text === "function") {
    return (await response.text())?.trim?.() ?? "";
  }
  if (typeof response.text === "string") {
    return response.text.trim();
  }
  return "";
};

export const generateQuizQuestions = async (
  apiKey: string,
  { transcript, questionCount = 5 }: GeminiQuizParams
): Promise<Omit<Question, "id">[]> => {
  if (!apiKey) {
    throw new Error("Gemini APIキーが設定されていません。");
  }
  if (!transcript || !transcript.trim()) {
    throw new Error("文字起こしが入力されていません。");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: buildPrompt(transcript, questionCount),
    config: {
      responseMimeType: "application/json",
      responseSchema: quizGenerationSchema,
      temperature: 0.5,
    },
  });

  const jsonString = await normalizeModelText(response);
  if (!jsonString) {
    throw new Error("AIが問題の配列を返しませんでした。");
  }

  const generatedQuestions = JSON.parse(jsonString) as Omit<Question, "id">[];
  if (!Array.isArray(generatedQuestions)) {
    throw new Error("AIが問題の配列を返しませんでした。");
  }

  const sanitizedQuestions = generatedQuestions.filter((q) => {
    const hasQuestion = typeof q?.question_text === "string" && q.question_text.trim().length > 0;
    const hasOptions =
      Array.isArray(q?.options) && q.options.length === 4 && q.options.every((opt) => typeof opt === "string");
    const hasAnswer =
      typeof q?.correct_answer === "number" && q.correct_answer >= 1 && q.correct_answer <= 4;
    return hasQuestion && hasOptions && hasAnswer;
  });

  if (sanitizedQuestions.length === 0) {
    throw new Error("有効なクイズ問題を生成できませんでした。");
  }

  return sanitizedQuestions;
};
