export async function analyzePhotoAsync(localUri) {
  await new Promise(r => setTimeout(r, 1200));
  // Return plausible, editable defaults
  const items = [
    { name: "Chicken breast", grams: 150, kcal: 240, protein: 45, carbs: 0, fat: 5, confidence: 0.7 },
    { name: "Rice", grams: 180, kcal: 230, protein: 5, carbs: 50, fat: 1, confidence: 0.6 },
    { name: "Broccoli", grams: 90, kcal: 30, protein: 3, carbs: 6, fat: 0, confidence: 0.8 },
  ];
  const total = items.reduce((t, i) => ({
    kcal: t.kcal + i.kcal, 
    protein: t.protein + i.protein, 
    carbs: t.carbs + i.carbs, 
    fat: t.fat + i.fat
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  return { items, total };
}
