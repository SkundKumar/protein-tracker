"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { MealAnalysis } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function recalculateMacros(foodList: string[]): Promise<MealAnalysis | { error: string }> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are a strict, highly accurate sports nutritionist.
    The user has corrected a list of food items they ate. 
    
    Here is the exact list of items:
    ${JSON.stringify(foodList)}
    
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
      "mealName": "Corrected Meal",
      "items": [
        { 
          "name": "string", 
          "unit": "string",
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
    const result = await model.generateContent(prompt);
    const cleanJson = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson) as MealAnalysis;
  } catch (error) {
    console.error("Recalculation Error:", error);
    return { error: "Failed to recalculate macros." };
  }
}