import { generateQuizQuestions } from "../server/geminiQuiz";

const sendJson = (res: any, status: number, payload: Record<string, unknown>) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
};

const parseBody = (req: any) => {
  if (!req?.body) {
    return {};
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

export default async function handler(req: any, res: any) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (req.method === "GET") {
    return sendJson(res, 200, { ready: Boolean(apiKey) });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  if (!apiKey) {
    return sendJson(res, 503, { error: "Gemini APIキーが設定されていません。" });
  }

  try {
    const body = parseBody(req);
    const { transcript, questionCount } = body;

    if (typeof transcript !== "string" || !transcript.trim()) {
      return sendJson(res, 400, { error: "文字起こしは必須です。" });
    }

    const questions = await generateQuizQuestions(apiKey, { transcript, questionCount });
    return sendJson(res, 200, { questions });
  } catch (error: any) {
    console.error("generate-quiz error:", error);
    return sendJson(res, 500, { error: error?.message ?? "クイズの生成に失敗しました。" });
  }
}
