"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { MealAnalysis } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function analyzeFoodImage(formData: FormData): Promise<MealAnalysis | { error: string }> {
  const file = formData.get("image") as File | null;
  const userContext = formData.get("context") as string | null;

  if (!file) return { error: "No image uploaded" };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64Image = buffer.toString("base64");

  // Using the correct, active model
  const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash"
});

  const prompt = `
    You are a strict, highly accurate sports nutritionist.
    Analyze this food image. ${userContext ? `USER CONTEXT: "${userContext}"` : ""}
    
    CRITICAL INSTRUCTIONS:
    1. THE NATURAL UNIT RULE: Choose the most logical, human-friendly base unit.
       - For discrete items (bread, eggs, fruits): Use "1 slice", "1 large egg", "1 medium apple".
       - For liquids (tea, milk): Use "1 cup" or "100ml".
       - For bulk/amorphous foods (rice, bhurji, sabzi, halwa, dal): You MUST use exactly "100g".
    2. NUTRITIONAL FACT-CHECK: Consider hydration. Cooked foods (rice, dal, halwa) weigh more but have LESS protein per 100g than raw ingredients. Calibrate baseProtein for the COOKED state.
    3. ACCURATE MACROS: Report exact protein and calorie values as they exist in standard nutritional databases. Do not arbitrarily force values to 0 unless the food genuinely has ~0g (like plain sugar, jam, or water). Factor in standard recipe ingredients (e.g., ghee and nuts in Sooji Halwa).
    4. Determine the QUANTITY based on the user's text. If not specified, default to 1.
    5. Return ONLY a JSON object. No markdown.

    Structure exactly like this:
    {
      "mealName": "string",
      "items": [
        { 
          "name": "string", 
          "unit": "string (e.g., '100g', '1 slice', '1 cup')",
          "quantity": number,
          "baseProtein": number, 
          "baseCalories": number 
        }
      ],
      "totalProtein": number,
      "totalCalories": number,
      "confidence": "High"
    }
  `;
  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type,
        },
      },
    ]);

    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    
    return JSON.parse(cleanJson) as MealAnalysis;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return { error: "Failed to analyze the image. Please try again." };
  }
}