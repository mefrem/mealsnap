import { Stack } from "expo-router";
import "react-native-gesture-handler";
import { useEffect } from "react";
import { QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from "@/state/useAuth";
import { queryClient } from "@/state/queryClient";

function AppContent() {
  const { init } = useAuth();
  
  useEffect(() => {
    init();
  }, [init]);

  return <Stack />;
}

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
