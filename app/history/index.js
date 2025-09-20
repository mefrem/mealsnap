import { View, Text, FlatList, TouchableOpacity, Image, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useAuth } from "@/state/useAuth";
import { db } from "@/config/firebase";
import { collection, query, orderBy, limit, getDocs, startAfter, doc, deleteDoc } from "firebase/firestore";
import { router } from "expo-router";

export default function History() {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user) {
      loadMeals();
    }
  }, [user]);

  const loadMeals = async (loadMore = false) => {
    if (!user) return;

    try {
      setLoading(true);
      let q = query(
        collection(db, `meals/${user.uid}/items`),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      if (loadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const newMeals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (loadMore) {
        setMeals(prev => [...prev, ...newMeals]);
      } else {
        setMeals(newMeals);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 10);
    } catch (error) {
      Alert.alert("Error", "Failed to load meals");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async (mealId) => {
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
              setMeals(prev => prev.filter(meal => meal.id !== mealId));
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

  const renderMeal = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: 'white',
        margin: 8,
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}
      onPress={() => router.push({
        pathname: "/history/detail",
        params: { mealId: item.id }
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={{ uri: item.photoStoragePath }}
          style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
            {item.ai?.total?.kcal || 0} calories
          </Text>
          <Text style={{ color: '#666', marginBottom: 4 }}>
            {formatDate(item.createdAt)}
          </Text>
          <Text style={{ color: '#666', fontSize: 12 }}>
            {item.ai?.items?.length || 0} items
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteMeal(item.id)}
          style={{ padding: 8 }}
        >
          <Text style={{ color: 'red', fontSize: 18 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading && meals.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading meals...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Meal History</Text>
      </View>
      
      {meals.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
            No meals yet!{'\n'}Start by capturing your first meal.
          </Text>
        </View>
      ) : (
        <FlatList
          data={meals}
          renderItem={renderMeal}
          keyExtractor={(item) => item.id}
          onEndReached={() => {
            if (hasMore && !loading) {
              loadMeals(true);
            }
          }}
          onEndReachedThreshold={0.5}
          refreshing={loading}
          onRefresh={() => loadMeals(false)}
        />
      )}
    </View>
  );
}
