import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useAuth } from "@/state/useAuth";
import { useMeals } from "@/state/useMeals";
import { db, storage } from "@/config/firebase";
import { collection, getDocs, doc, deleteDoc, query } from "firebase/firestore";
import { ref, listAll, deleteObject } from "firebase/storage";
import { router } from "expo-router";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { meals } = useMeals();

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/auth/login");
            } catch (error) {
              Alert.alert("Error", "Failed to sign out");
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all your meals and photos. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All Data",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              "Are you absolutely sure? This will delete everything permanently.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: deleteAllUserData
                }
              ]
            );
          }
        }
      ]
    );
  };

  const deleteAllUserData = async () => {
    if (!user) return;

    try {
      // Delete all meal documents
      const mealsSnapshot = await getDocs(collection(db, `meals/${user.uid}/items`));
      const deletePromises = mealsSnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, `meals/${user.uid}/items`, docSnapshot.id))
      );
      await Promise.all(deletePromises);

      // Delete all photos from storage
      const imagesRef = ref(storage, `images/${user.uid}`);
      const imagesList = await listAll(imagesRef);
      const deleteImagePromises = imagesList.items.map(imageRef => 
        deleteObject(imageRef)
      );
      await Promise.all(deleteImagePromises);

      Alert.alert("Success", "All your data has been deleted successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to delete some data. Please try again.");
      console.error(error);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Settings</Text>
      </View>

      <View style={{ padding: 16 }}>
        {/* User Info */}
        <View style={{ 
          backgroundColor: 'white', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Account</Text>
          <Text style={{ color: '#666', marginBottom: 4 }}>Email: {user?.email}</Text>
          <Text style={{ color: '#666', marginBottom: 4 }}>User ID: {user?.uid}</Text>
          <Text style={{ color: '#666' }}>Total Meals: {meals.length}</Text>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={{ 
            backgroundColor: '#FF9500', 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 16 
          }}
          onPress={handleSignOut}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* Delete All Data */}
        <TouchableOpacity
          style={{ 
            backgroundColor: 'red', 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 16 
          }}
          onPress={handleDeleteAllData}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            🗑️ Delete All My Data
          </Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={{ 
          backgroundColor: 'white', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>App Information</Text>
          <Text style={{ color: '#666', marginBottom: 4 }}>Version: 1.0.0</Text>
          <Text style={{ color: '#666', marginBottom: 4 }}>MealSnap - AI-Powered Nutrition Tracking</Text>
          <Text style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
            This app uses AI to analyze your meal photos and estimate nutritional information. 
            Results are for informational purposes only and should not replace professional dietary advice.
          </Text>
        </View>

        {/* Privacy Notice */}
        <View style={{ 
          backgroundColor: '#E3F2FD', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: '#2196F3'
        }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#1976D2' }}>
            Privacy & Data
          </Text>
          <Text style={{ color: '#666', fontSize: 14, lineHeight: 20 }}>
            • Your photos and meal data are stored securely in Firebase{'\n'}
            • Only you can access your personal data{'\n'}
            • Photos are processed locally and stored encrypted{'\n'}
            • You can delete all your data at any time using the button above
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
