import { GoogleGenAI } from "@google/genai";
import { EngineResponse, FileObject, LogEntry } from "../types";
import { SYSTEM_INSTRUCTION, generatePrompt } from "../constants";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please connect your Google AI Key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const sendToEngine = async (
  userInput: string,
  files: Record<string, FileObject>,
  history: LogEntry[],
  worldTime: number
): Promise<EngineResponse> => {
  try {
    const ai = getAiClient();
    
    // Using gemini-3-flash-preview as it is the recommended model for basic text tasks
    // and is highly efficient for real-time engine responses.
    const modelId = "gemini-3-flash-preview";

    const prompt = generatePrompt(userInput, files, history, worldTime);

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.7, 
      },
    });

    const responseText = response.text;
    
    if (!responseText) {
      throw new Error("Empty response from AI Engine");
    }

    try {
      const parsed: EngineResponse = JSON.parse(responseText);
      return parsed;
    } catch (e) {
      console.error("Failed to parse AI response", responseText);
      throw new Error("Engine Critical Failure: Invalid JSON Output");
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
