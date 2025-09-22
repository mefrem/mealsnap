import { db } from "@/config/firebase";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { analyzePhotoAsync } from "@/lib/aiStub";
import { useAuth } from "@/state/useAuth";
import { router, useLocalSearchParams } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Review() {
  const { photoUri } = useLocalSearchParams();
  const { user, loading: authLoading } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(true);
  const [aiData, setAiData] = useState(null);
  const [notes, setNotes] = useState("");
  const [editingField, setEditingField] = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, authLoading]);

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
    if (!user || !photoUri || !aiData) {
      console.log("Missing required data:", {
        user: !!user,
        photoUri: !!photoUri,
        aiData: !!aiData,
      });
      return;
    }

    setLoading(true);
    try {
      console.log("User UID:", user.uid);
      console.log("User object:", user);
      console.log("User email:", user.email);
      console.log("User emailVerified:", user.emailVerified);
      console.log("User isAnonymous:", user.isAnonymous);

      // For React Native, we need to use a different approach for file upload
      // Let's save the meal data without uploading the photo for now
      // In a production app, you'd use expo-file-system to read the file properly

      const mealData = {
        createdAt: serverTimestamp(),
        photoUri: photoUri, // Store local URI for now
        ai: aiData,
        manualAdjustments: null,
        notes: notes || null,
        userId: user.uid,
      };

      console.log(
        "Attempting to save to collection:",
        `meals/${user.uid}/items`
      );
      console.log("Meal data:", mealData);

      // Test if we can access the collection first
      console.log("Testing collection access...");
      const testCollection = collection(db, `meals/${user.uid}/items`);
      console.log("Collection reference created successfully");

      await addDoc(testCollection, mealData);

      Alert.alert("Success", "Meal saved successfully!", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
    } catch (error) {
      console.error("Save meal error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      Alert.alert("Error", `Failed to save meal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Utility function to format numbers properly
  const formatNumber = (num, decimals = 1) => {
    if (typeof num !== "number" || isNaN(num)) return 0;
    return Number(num.toFixed(decimals));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...aiData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate totals with proper rounding
    const total = newItems.reduce(
      (t, i) => ({
        kcal: formatNumber(t.kcal + (i.kcal || 0)),
        protein: formatNumber(t.protein + (i.protein || 0)),
        carbs: formatNumber(t.carbs + (i.carbs || 0)),
        fat: formatNumber(t.fat + (i.fat || 0)),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );

    setAiData({ items: newItems, total });
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Redirecting to login...</Text>
      </View>
    );
  }

  if (analyzing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Analyzing photo...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[styles.imageContainer, { backgroundColor: colors.surface }]}
      >
        <Image
          source={{ uri: photoUri }}
          style={styles.photo}
          resizeMode="cover"
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Detected Food Items
      </Text>

      {aiData?.items.map((item, index) => (
        <View
          key={index}
          style={[
            styles.foodItemCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.foodItemName, { color: colors.text }]}>
            {item.name}
          </Text>

          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Grams:
            </Text>
            <TextInput
              style={[
                styles.inputField,
                {
                  borderColor:
                    editingField === `${index}-grams`
                      ? colors.primary
                      : colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text,
                },
              ]}
              value={
                editingField === `${index}-grams`
                  ? item.grams.toString()
                  : formatNumber(item.grams).toString()
              }
              onChangeText={(value) =>
                updateItem(index, "grams", parseFloat(value) || 0)
              }
              onFocus={() => setEditingField(`${index}-grams`)}
              onBlur={() => setEditingField(null)}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Calories:
            </Text>
            <TextInput
              style={[
                styles.inputField,
                {
                  borderColor:
                    editingField === `${index}-kcal`
                      ? colors.primary
                      : colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text,
                },
              ]}
              value={
                editingField === `${index}-kcal`
                  ? item.kcal.toString()
                  : formatNumber(item.kcal).toString()
              }
              onChangeText={(value) =>
                updateItem(index, "kcal", parseFloat(value) || 0)
              }
              onFocus={() => setEditingField(`${index}-kcal`)}
              onBlur={() => setEditingField(null)}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Protein:
            </Text>
            <TextInput
              style={[
                styles.inputField,
                {
                  borderColor:
                    editingField === `${index}-protein`
                      ? colors.primary
                      : colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text,
                },
              ]}
              value={
                editingField === `${index}-protein`
                  ? item.protein.toString()
                  : formatNumber(item.protein).toString()
              }
              onChangeText={(value) =>
                updateItem(index, "protein", parseFloat(value) || 0)
              }
              onFocus={() => setEditingField(`${index}-protein`)}
              onBlur={() => setEditingField(null)}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Carbs:
            </Text>
            <TextInput
              style={[
                styles.inputField,
                {
                  borderColor:
                    editingField === `${index}-carbs`
                      ? colors.primary
                      : colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text,
                },
              ]}
              value={
                editingField === `${index}-carbs`
                  ? item.carbs.toString()
                  : formatNumber(item.carbs).toString()
              }
              onChangeText={(value) =>
                updateItem(index, "carbs", parseFloat(value) || 0)
              }
              onFocus={() => setEditingField(`${index}-carbs`)}
              onBlur={() => setEditingField(null)}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Fat:
            </Text>
            <TextInput
              style={[
                styles.inputField,
                {
                  borderColor:
                    editingField === `${index}-fat`
                      ? colors.primary
                      : colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text,
                },
              ]}
              value={
                editingField === `${index}-fat`
                  ? item.fat.toString()
                  : formatNumber(item.fat).toString()
              }
              onChangeText={(value) =>
                updateItem(index, "fat", parseFloat(value) || 0)
              }
              onFocus={() => setEditingField(`${index}-fat`)}
              onBlur={() => setEditingField(null)}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>
        </View>
      ))}

      <View
        style={[
          styles.totalCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Text style={[styles.totalTitle, { color: colors.text }]}>Total</Text>
        <Text style={[styles.totalText, { color: colors.text }]}>
          Calories: {formatNumber(aiData?.total.kcal || 0)}
        </Text>
        <Text style={[styles.totalText, { color: colors.text }]}>
          Protein: {formatNumber(aiData?.total.protein || 0)}g
        </Text>
        <Text style={[styles.totalText, { color: colors.text }]}>
          Carbs: {formatNumber(aiData?.total.carbs || 0)}g
        </Text>
        <Text style={[styles.totalText, { color: colors.text }]}>
          Fat: {formatNumber(aiData?.total.fat || 0)}g
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
      <TextInput
        style={[
          styles.notesInput,
          {
            borderColor:
              editingField === "notes" ? colors.primary : colors.border,
            backgroundColor: colors.surface,
            color: colors.text,
          },
        ]}
        placeholder="Add any notes about this meal..."
        placeholderTextColor={colors.icon}
        value={notes}
        onChangeText={setNotes}
        onFocus={() => setEditingField("notes")}
        onBlur={() => setEditingField(null)}
        multiline
      />

      <TouchableOpacity
        style={[
          styles.saveButton,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.shadow,
          },
        ]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? "Saving..." : "Save Meal"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.cancelButton,
          {
            backgroundColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
        onPress={() => router.back()}
      >
        <Text style={[styles.cancelButtonText, { color: colors.text }]}>
          Cancel
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    borderRadius: 16,
    padding: 8,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  foodItemCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  foodItemName: {
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  inputLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    // Prevent yellow highlighting on iOS
    backgroundColor: "transparent",
    // Remove default iOS styling
    textDecorationLine: "none",
    // Ensure consistent appearance
    minHeight: 36,
  },
  totalCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  totalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  totalText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    height: 100,
    textAlignVertical: "top",
    fontSize: 16,
    // Prevent yellow highlighting on iOS
    backgroundColor: "transparent",
    // Remove default iOS styling
    textDecorationLine: "none",
  },
  saveButton: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelButtonText: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});
