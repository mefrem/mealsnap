import { db } from "@/config/firebase";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { buildMealsCsv } from "@/lib/csv";
import { useAuth } from "@/state/useAuth";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function Reports() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  // Utility function to format numbers properly
  const formatNumber = (num, decimals = 1) => {
    if (typeof num !== "number" || isNaN(num)) return "0";
    return Number(num.toFixed(decimals)).toString();
  };

  // Calculate daily averages
  const getDailyAverages = () => {
    const days =
      selectedPeriod === "today" ? 1 : selectedPeriod === "7d" ? 7 : 30;
    return {
      kcal: formatNumber(totals.kcal / days),
      protein: formatNumber(totals.protein / days),
      carbs: formatNumber(totals.carbs / days),
      fat: formatNumber(totals.fat / days),
    };
  };

  // Calculate macro percentages
  const getMacroPercentages = () => {
    const totalMacros = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;
    if (totalMacros === 0) return { protein: 0, carbs: 0, fat: 0 };

    return {
      protein: formatNumber(((totals.protein * 4) / totalMacros) * 100),
      carbs: formatNumber(((totals.carbs * 4) / totalMacros) * 100),
      fat: formatNumber(((totals.fat * 9) / totalMacros) * 100),
    };
  };

  useEffect(() => {
    if (user) {
      loadMeals();
    }
  }, [user, selectedPeriod]);

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();

    switch (selectedPeriod) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "7d":
        start.setDate(now.getDate() - 7);
        break;
      case "30d":
        start.setDate(now.getDate() - 30);
        break;
      default:
        start.setHours(0, 0, 0, 0);
    }

    return { start, end: now };
  };

  const loadMeals = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { start, end } = getDateRange();

      const q = query(
        collection(db, `meals/${user.uid}/items`),
        where("createdAt", ">=", start),
        where("createdAt", "<=", end),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const mealsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMeals(mealsData);

      // Calculate totals
      const calculatedTotals = mealsData.reduce(
        (acc, meal) => ({
          kcal: acc.kcal + (meal.ai?.total?.kcal || 0),
          protein: acc.protein + (meal.ai?.total?.protein || 0),
          carbs: acc.carbs + (meal.ai?.total?.carbs || 0),
          fat: acc.fat + (meal.ai?.total?.fat || 0),
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      );

      setTotals(calculatedTotals);
    } catch (error) {
      Alert.alert("Error", "Failed to load meals");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (meals.length === 0) {
      Alert.alert("No Data", "No meals to export for the selected period");
      return;
    }

    try {
      const csvContent = buildMealsCsv(meals);
      const fileName = `mealsnap-${selectedPeriod}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Export Meal Data",
        });
      } else {
        Alert.alert("Export Complete", `CSV saved to: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to export CSV");
      console.error(error);
    }
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case "today":
        return "Today";
      case "7d":
        return "7 Days";
      case "30d":
        return "30 Days";
      default:
        return "Today";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const dailyAverages = getDailyAverages();
  const macroPercentages = getMacroPercentages();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Nutrition Dashboard
        </Text>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {["today", "7d", "30d"].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                {
                  backgroundColor:
                    selectedPeriod === period ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  { color: selectedPeriod === period ? "white" : colors.text },
                ]}
              >
                {getPeriodLabel(period)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Overview Cards */}
      <View style={styles.overviewSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {getPeriodLabel(selectedPeriod)} Overview
        </Text>

        <View style={styles.overviewGrid}>
          <View
            style={[
              styles.overviewCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Text style={[styles.overviewValue, { color: colors.primary }]}>
              {meals.length}
            </Text>
            <Text style={[styles.overviewLabel, { color: colors.text }]}>
              Meals
            </Text>
          </View>

          <View
            style={[
              styles.overviewCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Text style={[styles.overviewValue, { color: colors.accent }]}>
              {formatNumber(totals.kcal)}
            </Text>
            <Text style={[styles.overviewLabel, { color: colors.text }]}>
              Calories
            </Text>
          </View>

          <View
            style={[
              styles.overviewCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Text style={[styles.overviewValue, { color: colors.secondary }]}>
              {formatNumber(totals.protein)}g
            </Text>
            <Text style={[styles.overviewLabel, { color: colors.text }]}>
              Protein
            </Text>
          </View>

          <View
            style={[
              styles.overviewCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Text style={[styles.overviewValue, { color: colors.error }]}>
              {formatNumber(totals.carbs)}g
            </Text>
            <Text style={[styles.overviewLabel, { color: colors.text }]}>
              Carbs
            </Text>
          </View>
        </View>
      </View>

      {/* Macro Breakdown */}
      <View style={styles.macroSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Macro Breakdown
        </Text>

        <View
          style={[
            styles.macroCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.macroRow}>
            <View style={styles.macroInfo}>
              <View
                style={[styles.macroDot, { backgroundColor: colors.secondary }]}
              />
              <Text style={[styles.macroLabel, { color: colors.text }]}>
                Protein
              </Text>
            </View>
            <View style={styles.macroValues}>
              <Text style={[styles.macroAmount, { color: colors.text }]}>
                {formatNumber(totals.protein)}g
              </Text>
              <Text style={[styles.macroPercentage, { color: colors.icon }]}>
                {macroPercentages.protein}%
              </Text>
            </View>
          </View>

          <View style={styles.macroRow}>
            <View style={styles.macroInfo}>
              <View
                style={[styles.macroDot, { backgroundColor: colors.error }]}
              />
              <Text style={[styles.macroLabel, { color: colors.text }]}>
                Carbs
              </Text>
            </View>
            <View style={styles.macroValues}>
              <Text style={[styles.macroAmount, { color: colors.text }]}>
                {formatNumber(totals.carbs)}g
              </Text>
              <Text style={[styles.macroPercentage, { color: colors.icon }]}>
                {macroPercentages.carbs}%
              </Text>
            </View>
          </View>

          <View style={styles.macroRow}>
            <View style={styles.macroInfo}>
              <View
                style={[styles.macroDot, { backgroundColor: colors.accent }]}
              />
              <Text style={[styles.macroLabel, { color: colors.text }]}>
                Fat
              </Text>
            </View>
            <View style={styles.macroValues}>
              <Text style={[styles.macroAmount, { color: colors.text }]}>
                {formatNumber(totals.fat)}g
              </Text>
              <Text style={[styles.macroPercentage, { color: colors.icon }]}>
                {macroPercentages.fat}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Daily Averages */}
      {selectedPeriod !== "today" && (
        <View style={styles.averagesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Daily Averages
          </Text>

          <View
            style={[
              styles.averagesCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.averagesGrid}>
              <View style={styles.averageItem}>
                <Text style={[styles.averageValue, { color: colors.accent }]}>
                  {dailyAverages.kcal}
                </Text>
                <Text style={[styles.averageLabel, { color: colors.text }]}>
                  Calories/day
                </Text>
              </View>

              <View style={styles.averageItem}>
                <Text
                  style={[styles.averageValue, { color: colors.secondary }]}
                >
                  {dailyAverages.protein}g
                </Text>
                <Text style={[styles.averageLabel, { color: colors.text }]}>
                  Protein/day
                </Text>
              </View>

              <View style={styles.averageItem}>
                <Text style={[styles.averageValue, { color: colors.error }]}>
                  {dailyAverages.carbs}g
                </Text>
                <Text style={[styles.averageLabel, { color: colors.text }]}>
                  Carbs/day
                </Text>
              </View>

              <View style={styles.averageItem}>
                <Text style={[styles.averageValue, { color: colors.accent }]}>
                  {dailyAverages.fat}g
                </Text>
                <Text style={[styles.averageLabel, { color: colors.text }]}>
                  Fat/day
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Export Button */}
      <View style={styles.exportSection}>
        <TouchableOpacity
          style={[
            styles.exportButton,
            { backgroundColor: colors.success, shadowColor: colors.shadow },
          ]}
          onPress={handleExportCSV}
          disabled={loading || meals.length === 0}
        >
          <Text style={styles.exportButtonText}>📊 Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Meal List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading meals...
          </Text>
        </View>
      ) : meals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            No meals found for {getPeriodLabel(selectedPeriod).toLowerCase()}
          </Text>
        </View>
      ) : (
        <View style={styles.mealsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Meals
          </Text>
          {meals.slice(0, 10).map((meal) => (
            <View
              key={meal.id}
              style={[
                styles.mealCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                },
              ]}
            >
              <View style={styles.mealHeader}>
                <View>
                  <Text style={[styles.mealCalories, { color: colors.text }]}>
                    {formatNumber(meal.ai?.total?.kcal || 0)} calories
                  </Text>
                  <Text style={[styles.mealDate, { color: colors.icon }]}>
                    {formatDate(meal.createdAt)}
                  </Text>
                </View>
                <View style={styles.mealStats}>
                  <Text style={[styles.mealItems, { color: colors.icon }]}>
                    {meal.ai?.items?.length || 0} items
                  </Text>
                  <Text style={[styles.mealMacros, { color: colors.icon }]}>
                    P: {formatNumber(meal.ai?.total?.protein || 0)}g | C:{" "}
                    {formatNumber(meal.ai?.total?.carbs || 0)}g | F:{" "}
                    {formatNumber(meal.ai?.total?.fat || 0)}g
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  periodSelector: {
    flexDirection: "row",
    gap: 8,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  periodButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  overviewSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  overviewCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  macroSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  macroCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  macroInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  macroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  macroValues: {
    alignItems: "flex-end",
  },
  macroAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  macroPercentage: {
    fontSize: 12,
    fontWeight: "500",
  },
  averagesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  averagesCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  averagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  averageItem: {
    width: (width - 72) / 2,
    alignItems: "center",
  },
  averageValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  averageLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  exportSection: {
    padding: 20,
  },
  exportButton: {
    padding: 18,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exportButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  mealsSection: {
    padding: 20,
  },
  mealCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  mealDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  mealStats: {
    alignItems: "flex-end",
  },
  mealItems: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  mealMacros: {
    fontSize: 11,
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
});
