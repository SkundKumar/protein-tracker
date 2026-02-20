"use client";

import { useState } from "react";
import { analyzeFoodImage } from "@/actions/analyze";
import { recalculateMacros } from "@/actions/recalculate";
import { MealAnalysis } from "@/types";

interface InteractiveItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  baseProtein: number;
  baseCalories: number;
}

export default function AnalyzerForm() {
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InteractiveItem[]>([]);

  async function handleImageSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const response = await analyzeFoodImage(formData);
    
    if ("error" in response) {
      setError(response.error);
    } else {
      setItems(response.items.map(item => ({ id: crypto.randomUUID(), ...item })));
    }
    setLoading(false);
  }

  const updateField = (id: string, field: keyof InteractiveItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addNewItem = () => {
    setItems(prev => [...prev, { 
      id: crypto.randomUUID(), name: "New Food", unit: "1 serving", quantity: 1, baseProtein: 0, baseCalories: 0 
    }]);
  };

  async function handleRecalculate() {
    setRecalculating(true);
    const queries = items.map(item => `${item.quantity}x ${item.name}`);
    const response = await recalculateMacros(queries);
    
    if ("error" in response) {
      setError(response.error);
    } else {
      setItems(response.items.map(item => ({ id: crypto.randomUUID(), ...item })));
    }
    setRecalculating(false);
  }

  const grandTotalProtein = items.reduce((sum, item) => sum + (item.baseProtein * item.quantity), 0);
  const grandTotalCalories = items.reduce((sum, item) => sum + (item.baseCalories * item.quantity), 0);

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-gray-200 p-6 shadow-lg bg-white text-black font-sans">
      
      <form onSubmit={handleImageSubmit} className="flex flex-col gap-4 mb-8">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add Context (Optional)</label>
          <input type="text" name="context" placeholder="e.g., right is scrambled egg" className="w-full border border-gray-300 p-3 rounded-lg mt-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
        </div>
        <div>
          <input type="file" name="image" accept="image/*"  required className="w-full border border-gray-300 p-2 rounded-lg text-sm"/>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-black hover:bg-gray-800 text-white p-3 font-bold rounded-lg disabled:bg-gray-400">
          {loading ? "Analyzing Context & Image..." : "Analyze Meal"}
        </button>
      </form>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold border border-red-200">{error}</div>}

      {items.length > 0 && (
        <div className="border-t border-gray-200 pt-8">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900">Food Log</h2>
            <button onClick={handleRecalculate} disabled={recalculating} className="text-sm font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50">
              {recalculating ? "↻ Recalculating..." : "↻ Refresh AI Macros"}
            </button>
          </div>

          <div className="flex flex-col gap-4 mb-8">
            {items.map((item) => {
              // --- SMART UNIT LOGIC ---
              const isBulk100g = item.unit.includes("100g");
              const isBulk100ml = item.unit.includes("100ml");
              const isBulk = isBulk100g || isBulk100ml;
              
              // Clean up the suffix (e.g., "1 slice" becomes "slice", "1 large egg" becomes "large egg")
              const displaySuffix = isBulk100g ? "g" : isBulk100ml ? "ml" : item.unit.replace(/^1\s*/, '');
              
              // If bulk, we multiply by 100 for the UI input box. Otherwise, show exact quantity.
              const displayValue = isBulk ? Math.round(item.quantity * 100) : item.quantity;

              return (
                <div key={item.id} className="relative flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors group">
                  
                  <button onClick={() => deleteItem(item.id)} className="absolute -top-2 -right-2 bg-white border border-red-200 text-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm opacity-100 sm:opacity-0 group-hover:opacity-100">✕</button>

                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={item.name}
                      onChange={(e) => updateField(item.id, "name", e.target.value)}
                      className="w-full bg-transparent text-base font-bold text-gray-800 outline-none border-b border-transparent focus:border-blue-500 pb-1"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      AI Base: {item.baseProtein}g P per {item.unit}
                    </div>
                  </div>

                  {/* Dynamic Quantity Input */}
                  <div className="flex items-center bg-white border border-gray-300 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500 min-w-[100px] justify-end">
                    <input 
                      type="number" 
                      step={isBulk ? "10" : "0.5"} 
                      min="0"
                      value={displayValue} 
                      onChange={(e) => {
                        // If they type 150g, we save 1.5. If they type 3 slices, we save 3.
                        const rawValue = Number(e.target.value);
                        const newQuantity = isBulk ? rawValue / 100 : rawValue;
                        updateField(item.id, "quantity", newQuantity);
                      }}
                      className="w-12 text-right font-bold text-gray-900 outline-none text-sm p-1 appearance-none"
                    />
                    <span className="text-xs font-bold text-gray-500 ml-1 truncate max-w-[50px]">
                      {displaySuffix}
                    </span>
                  </div>

                  <div className="flex flex-col items-end min-w-[80px]">
                    <span className="font-mono text-lg font-bold text-green-600">
                      {(item.baseProtein * item.quantity).toFixed(1)}g
                    </span>
                    <span className="font-mono text-xs text-gray-500">
                      {Math.round(item.baseCalories * item.quantity)} Cal
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button onClick={addNewItem} className="text-sm text-blue-600 font-bold hover:bg-blue-50 px-3 py-2 rounded-lg mb-8">+ Add Missing Item</button>

          <div className="bg-gray-900 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 text-white shadow-xl">
            <span className="font-extrabold text-xl tracking-wide">Final Totals</span>
            <div className="flex items-end gap-6">
              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Calories</span>
                <span className="font-bold text-3xl leading-none">{Math.round(grandTotalCalories)}</span>
              </div>
              <div className="w-px h-10 bg-gray-700"></div>
              <div className="flex flex-col items-end">
                <span className="text-sm text-green-400 font-bold uppercase tracking-wider mb-1">Protein</span>
                <span className="font-bold text-3xl leading-none text-green-400">{grandTotalProtein.toFixed(1)}g</span>
              </div>
            </div>
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 font-bold rounded-xl text-lg mt-6 shadow-md transition-all active:scale-[0.98]">
            Save to Log
          </button>
        </div>
      )}
    </div>
  );
}