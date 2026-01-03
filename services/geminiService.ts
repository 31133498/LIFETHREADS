
import { GoogleGenAI } from "@google/genai";

/**
 * Helper to get an instance of the AI client.
 * Initializing inside the function prevents the app from crashing on load
 * if the environment variables are not yet injected.
 */
function getAI() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure it is configured.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateEntryReflection(content: string, date: string): Promise<string> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a thoughtful diary assistant. Here is a journal entry from ${date}: "${content}". Please provide a short (2-3 sentences) poetic or insightful reflection on this moment. Be warm and supportive.`,
    });
    return response.text || "A beautiful memory preserved.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating reflection.";
  }
}

export async function generateReflectionImage(content: string): Promise<string | null> {
  try {
    const ai = getAI();
    // Generate a visual prompt based on the content
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
  } catch (error) {
    console.error("Gemini Image Error:", error);
    return null;
  }
}

export async function generateYearSummary(entries: string[]): Promise<string> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize the following collection of diary entries into a cohesive story of a year. Focus on themes, growth, and emotions: \n\n ${entries.join("\n\n")}`,
    });
    return response.text || "Your year was a journey of moments.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate summary.";
  }
}
