import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "@/state/useAuth";
import { analyzePhotoAsync } from "@/lib/aiStub";
import { storage, db } from "@/config/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Review() {
  const { photoUri } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(true);
  const [aiData, setAiData] = useState(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (photoUri) {
      analyzePhoto();
    }
  }, [photoUri]);

  const analyzePhoto = async () => {
    try {
      const result = await analyzePhotoAsync(photoUri);
      setAiData(result);
    } catch (error) {
      Alert.alert("Error", "Failed to analyze photo");
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!user || !photoUri || !aiData) return;

    setLoading(true);
    try {
      // Upload photo to Firebase Storage
      const response = await fetch(photoUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `images/${user.uid}/${Date.now()}.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            // Progress tracking could go here
          },
          (error) => reject(error),
          () => resolve()
        );
      });

      const photoStoragePath = await getDownloadURL(uploadTask.snapshot.ref);

      // Save meal data to Firestore
      const mealData = {
        createdAt: serverTimestamp(),
        photoStoragePath,
        ai: aiData,
        manualAdjustments: null,
        notes: notes || null
      };

      await addDoc(collection(db, `meals/${user.uid}/items`), mealData);

      Alert.alert("Success", "Meal saved successfully!", [
        { text: "OK", onPress: () => router.replace("/") }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save meal");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...aiData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate totals
    const total = newItems.reduce((t, i) => ({
      kcal: t.kcal + (i.kcal || 0),
      protein: t.protein + (i.protein || 0),
      carbs: t.carbs + (i.carbs || 0),
      fat: t.fat + (i.fat || 0)
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

    setAiData({ items: newItems, total });
  };

  if (analyzing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Analyzing photo...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Image 
        source={{ uri: photoUri }} 
        style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 16 }}
        resizeMode="cover"
      />

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        Detected Food Items
      </Text>

      {aiData?.items.map((item, index) => (
        <View key={index} style={{ 
          borderWidth: 1, 
          borderColor: '#ccc', 
          borderRadius: 8, 
          padding: 12, 
          marginBottom: 12 
        }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>{item.name}</Text>
          
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Text style={{ flex: 1 }}>Grams:</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 4, width: 80, textAlign: 'center' }}
              value={item.grams.toString()}
              onChangeText={(value) => updateItem(index, 'grams', parseInt(value) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Text style={{ flex: 1 }}>Calories:</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 4, width: 80, textAlign: 'center' }}
              value={item.kcal.toString()}
              onChangeText={(value) => updateItem(index, 'kcal', parseInt(value) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Text style={{ flex: 1 }}>Protein:</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 4, width: 80, textAlign: 'center' }}
              value={item.protein.toString()}
              onChangeText={(value) => updateItem(index, 'protein', parseInt(value) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Text style={{ flex: 1 }}>Carbs:</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 4, width: 80, textAlign: 'center' }}
              value={item.carbs.toString()}
              onChangeText={(value) => updateItem(index, 'carbs', parseInt(value) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Text style={{ flex: 1 }}>Fat:</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 4, width: 80, textAlign: 'center' }}
              value={item.fat.toString()}
              onChangeText={(value) => updateItem(index, 'fat', parseInt(value) || 0)}
              keyboardType="numeric"
            />
          </View>
        </View>
      ))}

      <View style={{ 
        backgroundColor: '#f0f0f0', 
        padding: 16, 
        borderRadius: 8, 
        marginBottom: 16 
      }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Total</Text>
        <Text>Calories: {aiData?.total.kcal}</Text>
        <Text>Protein: {aiData?.total.protein}g</Text>
        <Text>Carbs: {aiData?.total.carbs}g</Text>
        <Text>Fat: {aiData?.total.fat}g</Text>
      </View>

      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Notes</Text>
      <TextInput
        style={{ 
          borderWidth: 1, 
          borderColor: '#ccc', 
          borderRadius: 8, 
          padding: 12, 
          marginBottom: 16,
          height: 80,
          textAlignVertical: 'top'
        }}
        placeholder="Add any notes about this meal..."
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity
        style={{ 
          backgroundColor: '#007AFF', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 16 
        }}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          {loading ? "Saving..." : "Save Meal"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ 
          backgroundColor: '#ccc', 
          padding: 16, 
          borderRadius: 8 
        }}
        onPress={() => router.back()}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Cancel
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
