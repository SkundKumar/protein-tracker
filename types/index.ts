export interface FoodItem {
  name: string;
  unit: string; // e.g., "1 large egg", "100g", "1 standard slice"
  quantity: number; // e.g., 2, 0.5, 1.5
  baseProtein: number; // Protein for exactly 1 unit
  baseCalories: number; // Calories for exactly 1 unit
}

export interface MealAnalysis {
  mealName: string;
  items: FoodItem[];
  totalProtein: number;
  totalCalories: number;
  confidence: "High" | "Medium" | "Low";
}