
import { GoogleGenAI } from "@google/genai";

/**
 * Helper to get an instance of the AI client.
 * Using a getter ensures we don't try to read process.env at the module level.
 */
function getAI() {
  // Access API_KEY from process.env which is injected by the platform
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("Gemini API Key is missing. Please check your environment variables.");
    return null;
  }
  
  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Failed to initialize GoogleGenAI:", e);
    return null;
  }
}

export async function generateEntryReflection(content: string, date: string): Promise<string> {
  try {
    const ai = getAI();
    if (!ai) return "Your memory is safely stored. AI reflection is currently unavailable.";
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a thoughtful diary assistant. Here is a journal entry from ${date}: "${content}". Please provide a short (2-3 sentences) poetic or insightful reflection on this moment. Be warm and supportive.`,
    });
    return response.text || "A beautiful memory preserved.";
  } catch (error: any) {
    console.warn("Gemini Reflection Error:", error.message);
    return "A moment to remember.";
  }
}

export async function generateReflectionImage(content: string): Promise<string | null> {
  try {
    const ai = getAI();
    if (!ai) return null;

    const promptResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a short, artistic image generation prompt (max 30 words) that captures the mood and essence of this diary entry: "${content}". Focus on abstract, dreamy, and nostalgic styles.`,
    });
    
    const visualPrompt = promptResponse.text || content;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `An artistic, dreamy, nostalgic illustration representing: ${visualPrompt}. High quality, soft lighting, evocative colors, watercolor and digital oil paint style. No text, no faces.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.warn("Gemini Image Error:", error.message);
    return null;
  }
}

export async function generateYearSummary(entries: string[]): Promise<string> {
  try {
    const ai = getAI();
    if (!ai) return "Your journey is a collection of beautiful threads.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize the following collection of diary entries into a cohesive story of a journey. Focus on themes, growth, and emotions: \n\n ${entries.join("\n\n")}`,
    });
    return response.text || "Your journey is a collection of beautiful threads.";
  } catch (error: any) {
    console.warn("Gemini Summary Error:", error.message);
    return "Your diary is full of meaningful moments.";
  }
}
