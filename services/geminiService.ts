import type { Question } from "../types";

export interface GenerateQuizPayload {
  transcript: string;
  questionCount?: number;
}

const handleResponse = async (response: Response) => {
  const data = await response
    .json()
    .catch(() => ({ error: "クイズの生成に失敗しました。" }));

  if (!response.ok) {
    throw new Error(data?.error ?? "クイズの生成に失敗しました。");
  }

  return data;
};

export const generateQuizFromTranscript = async ({
  transcript,
  questionCount = 5,
}: GenerateQuizPayload): Promise<Omit<Question, "id">[]> => {
  if (!transcript || !transcript.trim()) {
    throw new Error("文字起こしを入力してください。");
  }

  const response = await fetch("/api/generate-quiz", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transcript, questionCount }),
  });

  const data = await handleResponse(response);
  if (!Array.isArray(data?.questions)) {
    throw new Error("AIが問題の配列を返しませんでした。");
  }

  return data.questions;
};

export const fetchGeminiStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch("/api/generate-quiz", { method: "GET" });
    const data = await response.json().catch(() => ({ ready: false }));
    return Boolean(data?.ready);
  } catch (error) {
    console.warn("Failed to determine Gemini API status:", error);
    return false;
  }
};
