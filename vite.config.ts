import path from "path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "http";
import { generateQuizQuestions } from "./server/geminiQuiz";

const readJsonBody = async (req: IncomingMessage) => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    return {};
  }
};

const sendDevJson = (res: ServerResponse, status: number, payload: Record<string, unknown>) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const geminiDevPlugin = (): Plugin => ({
  name: "dev-gemini-api",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/api/generate-quiz")) {
        return next();
      }

      if (req.method === "GET") {
        return sendDevJson(res, 200, { ready: Boolean(process.env.GEMINI_API_KEY) });
      }

      if (req.method !== "POST") {
        return sendDevJson(res, 405, { error: "Method not allowed." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return sendDevJson(res, 503, { error: "Gemini APIキーが設定されていません。" });
      }

      try {
        const body = await readJsonBody(req);
        const { transcript, questionCount } = body;
        if (typeof transcript !== "string" || !transcript.trim()) {
          return sendDevJson(res, 400, { error: "文字起こしは必須です。" });
        }
        const questions = await generateQuizQuestions(process.env.GEMINI_API_KEY, {
          transcript,
          questionCount,
        });
        return sendDevJson(res, 200, { questions });
      } catch (error: any) {
        console.error("dev generate-quiz error:", error);
        return sendDevJson(res, 500, { error: error?.message ?? "クイズの生成に失敗しました。" });
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react(), geminiDevPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
