import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';

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
          description: "4つの選択肢文字列の配列",
        },
        correct_answer: {
          type: Type.INTEGER,
          description: "正解の選択肢を示す1から4の番号（1始まり）",
        },
      },
      required: ["question_text", "options", "correct_answer"],
    },
};

export const generateQuizFromTranscript = async (
  aiInstance: GoogleGenAI | null,
  transcript: string,
  questionCount: number = 5
): Promise<Omit<Question, 'id'>[]> => {
  if (!aiInstance) {
    throw new Error("Gemini APIキーが設定されていません。管理画面から設定してください。");
  }
  
  try {
    const prompt = `以下の文字起こしを基に、${questionCount}個の多肢選択式のクイズ問題を生成してください。各問題は、文字起こしの中の重要な概念の理解度を問うものにしてください。各問題には、選択肢を4つずつ用意してください。

文字起こし:
---
${transcript}
---
`;

    const response = await aiInstance.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: quizGenerationSchema,
            temperature: 0.5,
        },
    });

    const jsonString = response.text.trim();
    const generatedQuestions = JSON.parse(jsonString) as Omit<Question, 'id'>[];

    // Validate the generated questions
    if (!Array.isArray(generatedQuestions)) {
        throw new Error("AIが問題の配列を返しませんでした。");
    }

    return generatedQuestions.filter(q => 
        q.question_text && 
        Array.isArray(q.options) && 
        q.options.length === 4 && 
        typeof q.correct_answer === 'number' && 
        q.correct_answer >= 1 && 
        q.correct_answer <= 4
    );

  } catch (error) {
    console.error("Error generating quiz from transcript:", error);
    throw new Error("クイズの生成に失敗しました。文字起こしを確認するか、もう一度お試しください。");
  }
};
