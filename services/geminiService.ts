// src/services/geminiService.ts
import { GoogleGenAI } from "@google/genai";
import { User } from "../types";

// ✅ Fix for Vercel — declare import.meta.env types
declare const importMeta: {
  env: {
    VITE_GEMINI_API_KEY: string;
  };
};

// ✅ Get API key from Vite env
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ Gemini API Key missing");
    return null;
  }

  return new GoogleGenAI({ apiKey });
};

// =======================================
// MAIN FUNCTION
// =======================================

export const generateSystemMessage = async (
  context: "LOGIN" | "LEVEL_UP" | "FAILURE" | "ADVICE" | "REMINDER" | "PENALTY",
  user: User,
  userQuery?: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "SYSTEM ERROR: API KEY NOT FOUND.";

  const modelId = "gemini-2.5-flash";

  // =====================================================
  // SYSTEM INSTRUCTION (TONE CONTROL)
  // =====================================================
  const baseSystemInstruction = `
    You are "The System" from Solo Leveling.
    You respond in a robotic, cold, authoritative style.
    Address the user as "Player".
    Keep messages short unless the user asks for advice.
    Always follow the theme of RPG stats, quests, ranks, leveling.
  `;

  // =====================================================
  // PROMPT BASED ON CONTEXT
  // =====================================================
  let prompt = "";

  switch (context) {
    case "LOGIN":
      prompt = `Player ${user.username} has logged in. Level ${user.level}. Welcome them back and remind them of today's Daily Quest.`;
      break;

    case "LEVEL_UP":
      prompt = `Player reached Level ${user.level}. Issue a system-style level-up announcement.`;
      break;

    case "FAILURE":
      prompt = `Player failed today's Daily Quest. Warn them about the Penalty Zone.`;
      break;

    case "ADVICE":
      prompt = `Player requests advice: "${userQuery}". Provide fitness-themed RPG advice. Max 100 words.`;
      break;

    case "REMINDER":
      prompt = `Daily Quest not completed. Give a short threatening reminder about the Penalty Zone.`;
      break;

    case "PENALTY":
      prompt = `Player triggered Penalty Mode. Describe the challenge in a dramatic, dangerous tone.`;
      break;
  }

  // =====================================================
  // GEMINI REQUEST
  // =====================================================
  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: prompt,

      // ✅ Correct placement — works with Vercel & TypeScript
      config: {
        systemInstruction: baseSystemInstruction,
      },
    });

    return result.text || "SYSTEM: CONNECTION UNSTABLE.";
  } catch (err) {
    console.error("❌ Gemini API Error:", err);
    return "SYSTEM: OFFLINE.";
  }
};
