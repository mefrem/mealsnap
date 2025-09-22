// Utility function to format numbers properly
const formatNumber = (num, decimals = 1) => {
  if (typeof num !== "number" || isNaN(num)) return 0;
  return Number(num.toFixed(decimals));
};

export async function analyzePhotoAsync(localUri) {
  await new Promise((r) => setTimeout(r, 1200));

  // For now, return realistic apple data
  // In a real app, this would call an AI service like OpenAI Vision API
  const items = [
    {
      name: "Apple",
      grams: 182,
      kcal: formatNumber(95),
      protein: formatNumber(0.5),
      carbs: formatNumber(25),
      fat: formatNumber(0.3),
      confidence: 0.9,
    },
  ];

  const total = items.reduce(
    (t, i) => ({
      kcal: formatNumber(t.kcal + i.kcal),
      protein: formatNumber(t.protein + i.protein),
      carbs: formatNumber(t.carbs + i.carbs),
      fat: formatNumber(t.fat + i.fat),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return { items, total };
}
