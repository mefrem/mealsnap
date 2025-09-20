import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useAuth } from "@/state/useAuth";
import { db } from "@/config/firebase";
import { collection, query, orderBy, where, getDocs } from "firebase/firestore";
import { buildMealsCsv } from "@/lib/csv";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

export default function Reports() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0 });

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
      const mealsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMeals(mealsData);

      // Calculate totals
      const totals = mealsData.reduce((acc, meal) => ({
        kcal: acc.kcal + (meal.ai?.total?.kcal || 0),
        protein: acc.protein + (meal.ai?.total?.protein || 0),
        carbs: acc.carbs + (meal.ai?.total?.carbs || 0),
        fat: acc.fat + (meal.ai?.total?.fat || 0)
      }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

      setTotals(totals);
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
      const fileName = `mealsnap-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Meal Data'
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
      case "today": return "Today";
      case "7d": return "7 Days";
      case "30d": return "30 Days";
      default: return "Today";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Reports</Text>
        
        {/* Period Selector */}
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          {["today", "7d", "30d"].map((period) => (
            <TouchableOpacity
              key={period}
              style={{
                flex: 1,
                padding: 12,
                marginHorizontal: 4,
                borderRadius: 8,
                backgroundColor: selectedPeriod === period ? '#007AFF' : '#f0f0f0',
                alignItems: 'center'
              }}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={{
                color: selectedPeriod === period ? 'white' : 'black',
                fontWeight: 'bold'
              }}>
                {getPeriodLabel(period)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={{ 
          backgroundColor: '#f0f0f0', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            {getPeriodLabel(selectedPeriod)} Summary
          </Text>
          <Text style={{ marginBottom: 4 }}>Total Meals: {meals.length}</Text>
          <Text style={{ marginBottom: 4 }}>Total Calories: {totals.kcal}</Text>
          <Text style={{ marginBottom: 4 }}>Total Protein: {totals.protein}g</Text>
          <Text style={{ marginBottom: 4 }}>Total Carbs: {totals.carbs}g</Text>
          <Text>Total Fat: {totals.fat}g</Text>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={{ 
            backgroundColor: '#34C759', 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 16 
          }}
          onPress={handleExportCSV}
          disabled={loading || meals.length === 0}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            📊 Export CSV
          </Text>
        </TouchableOpacity>
      </View>

      {/* Meal List */}
      {loading ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>Loading meals...</Text>
        </View>
      ) : meals.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
            No meals found for {getPeriodLabel(selectedPeriod).toLowerCase()}
          </Text>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            Recent Meals
          </Text>
          {meals.slice(0, 10).map((meal) => (
            <View key={meal.id} style={{
              backgroundColor: 'white',
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontWeight: 'bold' }}>
                    {meal.ai?.total?.kcal || 0} calories
                  </Text>
                  <Text style={{ color: '#666', fontSize: 12 }}>
                    {formatDate(meal.createdAt)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    {meal.ai?.items?.length || 0} items
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    P: {meal.ai?.total?.protein || 0}g | C: {meal.ai?.total?.carbs || 0}g | F: {meal.ai?.total?.fat || 0}g
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
