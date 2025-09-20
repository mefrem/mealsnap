import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { Link, router } from "expo-router";
import { useAuth } from "@/state/useAuth";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUpEmail, signInWithGoogle } = useAuth();

  const handleEmailSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    try {
      await signUpEmail(email, password);
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
        Create Account
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
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 16, borderRadius: 8 }}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 24, borderRadius: 8 }}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      
      <TouchableOpacity
        style={{ backgroundColor: '#007AFF', padding: 16, borderRadius: 8, marginBottom: 16 }}
        onPress={handleEmailSignup}
        disabled={loading}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          {loading ? "Creating Account..." : "Create Account"}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={{ backgroundColor: '#DB4437', padding: 16, borderRadius: 8, marginBottom: 16 }}
        onPress={handleGoogleSignup}
        disabled={loading}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Sign Up with Google
        </Text>
      </TouchableOpacity>
      
      <Link href="/auth/login" style={{ textAlign: 'center', color: '#007AFF' }}>
        Already have an account? Sign in
      </Link>
    </View>
  );
}
