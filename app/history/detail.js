import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "@/state/useAuth";
import { db } from "@/config/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";

export default function MealDetail() {
  const { mealId } = useLocalSearchParams();
  const { user } = useAuth();
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mealId && user) {
      loadMeal();
    }
  }, [mealId, user]);

  const loadMeal = async () => {
    try {
      const docRef = doc(db, `meals/${user.uid}/items`, mealId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setMeal({ id: docSnap.id, ...docSnap.data() });
      } else {
        Alert.alert("Error", "Meal not found");
        router.back();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load meal");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Meal",
      "Are you sure you want to delete this meal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, `meals/${user.uid}/items`, mealId));
              Alert.alert("Success", "Meal deleted successfully", [
                { text: "OK", onPress: () => router.replace("/history") }
              ]);
            } catch (error) {
              Alert.alert("Error", "Failed to delete meal");
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading meal details...</Text>
      </View>
    );
  }

  if (!meal) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Meal not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      <Image
        source={{ uri: meal.photoStoragePath }}
        style={{ width: '100%', height: 300 }}
        resizeMode="cover"
      />
      
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
          Meal Details
        </Text>
        
        <Text style={{ color: '#666', marginBottom: 16 }}>
          {formatDate(meal.createdAt)}
        </Text>

        <View style={{ 
          backgroundColor: '#f0f0f0', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Nutrition Summary</Text>
          <Text>Total Calories: {meal.ai?.total?.kcal || 0}</Text>
          <Text>Protein: {meal.ai?.total?.protein || 0}g</Text>
          <Text>Carbohydrates: {meal.ai?.total?.carbs || 0}g</Text>
          <Text>Fat: {meal.ai?.total?.fat || 0}g</Text>
        </View>

        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
          Food Items
        </Text>

        {meal.ai?.items?.map((item, index) => (
          <View key={index} style={{ 
            borderWidth: 1, 
            borderColor: '#ddd', 
            borderRadius: 8, 
            padding: 12, 
            marginBottom: 12 
          }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>{item.name}</Text>
            <Text>Grams: {item.grams}</Text>
            <Text>Calories: {item.kcal}</Text>
            <Text>Protein: {item.protein}g</Text>
            <Text>Carbs: {item.carbs}g</Text>
            <Text>Fat: {item.fat}g</Text>
            {item.confidence && (
              <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                Confidence: {Math.round(item.confidence * 100)}%
              </Text>
            )}
          </View>
        ))}

        {meal.notes && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Notes</Text>
            <Text style={{ 
              backgroundColor: '#f9f9f9', 
              padding: 12, 
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: '#007AFF'
            }}>
              {meal.notes}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={{ 
            backgroundColor: 'red', 
            padding: 16, 
            borderRadius: 8, 
            marginTop: 24 
          }}
          onPress={handleDelete}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Delete Meal
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
