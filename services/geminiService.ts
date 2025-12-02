// src/services/geminiService.ts
import { GoogleGenAI } from "@google/genai";
import { User } from "../types";

// =======================================================
// GET CLIENT (works for Vite + Vercel)
// =======================================================
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ Gemini API Key missing");
    return null;
  }

  return new GoogleGenAI({ apiKey });
};

// =======================================================
// MAIN MESSAGE FUNCTION
// =======================================================
export const generateSystemMessage = async (
  context: "LOGIN" | "LEVEL_UP" | "FAILURE" | "ADVICE" | "REMINDER" | "PENALTY",
  user: User,
  userQuery?: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "SYSTEM ERROR: API KEY NOT FOUND.";

  const modelId = "gemini-2.5-flash";

  // SYSTEM TONE
  const baseSystemInstruction = `
    You are "The System" from Solo Leveling.
    You speak coldly, robotically, and with authority.
    Always call the user "Player".
    Keep responses short unless giving advice.
    Use RPG terms like Stats, Daily Quest, Penalty Zone, Level Up.
  `;

  // PROMPT SELECTION
  let prompt = "";

  switch (context) {
    case "LOGIN":
      prompt = `Player ${user.username} logged in. Level ${user.level}. Welcome them and remind them of today's Daily Quest.`;
      break;

    case "LEVEL_UP":
      prompt = `Player reached Level ${user.level}. Provide a system-style level-up announcement.`;
      break;

    case "FAILURE":
      prompt = `Player failed the Daily Quest. Warn them about the Penalty Zone.`;
      break;

    case "ADVICE":
      prompt = `Player asked: "${userQuery}". Give RPG-themed fitness advice in under 100 words.`;
      break;

    case "REMINDER":
      prompt = `Daily Quest unfinished. Issue a short threatening reminder about Penalty Mode.`;
      break;

    case "PENALTY":
      prompt = `Player triggered Penalty Mode. Describe it in a dramatic, dangerous Solo Leveling tone.`;
      break;
  }

  // GEMINI REQUEST
  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
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
