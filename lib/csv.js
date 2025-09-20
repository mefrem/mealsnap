export function buildMealsCsv(rows) {
  const header = ["datetime", "kcal", "protein", "carbs", "fat"].join(",");
  const body = rows.map(r => [
    r.createdAt?.toDate?.().toISOString?.() ?? "",
    r.ai?.total?.kcal ?? 0,
    r.ai?.total?.protein ?? 0,
    r.ai?.total?.carbs ?? 0,
    r.ai?.total?.fat ?? 0,
  ].join(",")).join("\n");
  return header + "\n" + body + "\n";
}
