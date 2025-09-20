import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { Link, router } from "expo-router";
import { useAuth } from "@/state/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInEmail, signInWithGoogle } = useAuth();

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      await signInEmail(email, password);
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 }}>
        Welcome to MealSnap
      </Text>
      
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 16, borderRadius: 8 }}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 24, borderRadius: 8 }}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity
        style={{ backgroundColor: '#007AFF', padding: 16, borderRadius: 8, marginBottom: 16 }}
        onPress={handleEmailLogin}
        disabled={loading}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          {loading ? "Signing In..." : "Sign In"}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={{ backgroundColor: '#DB4437', padding: 16, borderRadius: 8, marginBottom: 16 }}
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Sign In with Google
        </Text>
      </TouchableOpacity>
      
      <Link href="/auth/signup" style={{ textAlign: 'center', color: '#007AFF' }}>
        Don't have an account? Sign up
      </Link>
    </View>
  );
}
