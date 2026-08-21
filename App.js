import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ShareIntentProvider } from "expo-share-intent";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import AddExpenseScreen from "./src/screens/AddExpenseScreen";
import HistoryScreen from "./src/screens/HistoryScreen";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Orçamento" }} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: "Novo gasto" }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: "Histórico" }} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    // ShareIntentProvider permite que a app receba texto partilhado de outras
    // apps (ex: SMS do M-Pesa) através do menu nativo "Partilhar".
    <ShareIntentProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ShareIntentProvider>
  );
}
