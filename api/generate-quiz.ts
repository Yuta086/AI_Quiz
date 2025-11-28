import { generateQuizQuestions } from "../server/geminiQuiz";

export const config = {
  runtime: "edge",
};

const sendJson = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

const parseRequestBody = async (request: Request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

export default async function handler(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (request.method === "GET") {
    return sendJson(200, { ready: Boolean(apiKey) });
  }

  if (request.method !== "POST") {
    return sendJson(405, { error: "Method not allowed." });
  }

  if (!apiKey) {
    return sendJson(503, { error: "Gemini APIキーが設定されていません。" });
  }

  try {
    const body = await parseRequestBody(request);
    const { transcript, questionCount } = body as { transcript?: string; questionCount?: number };

    if (typeof transcript !== "string" || !transcript.trim()) {
      return sendJson(400, { error: "文字起こしは必須です。" });
    }

    const questions = await generateQuizQuestions(apiKey, { transcript, questionCount });
    return sendJson(200, { questions });
  } catch (error: any) {
    console.error("generate-quiz error:", error);
    return sendJson(500, { error: error?.message ?? "クイズの生成に失敗しました。" });
  }
}
