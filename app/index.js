import { Link, router } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { useEffect } from "react";
import { useAuth } from "@/state/useAuth";

export default function Home() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>
        Welcome to MealSnap
      </Text>
      <Text style={{ marginBottom: 24 }}>
        Logged in as: {user.email}
      </Text>
      
      <TouchableOpacity
        style={{ backgroundColor: '#007AFF', padding: 16, borderRadius: 8, marginBottom: 16 }}
        onPress={() => router.push("/camera/capture")}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          📸 Capture Meal
        </Text>
      </TouchableOpacity>
      
      <Link href="/history" style={{ marginBottom: 16, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, textAlign: 'center' }}>
        📊 View History
      </Link>
      
      <Link href="/reports" style={{ marginBottom: 16, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, textAlign: 'center' }}>
        📈 Reports
      </Link>
      
      <Link href="/settings" style={{ marginBottom: 16, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, textAlign: 'center' }}>
        ⚙️ Settings
      </Link>
    </View>
  );
}
