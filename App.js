import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { PreferencesProvider } from "./src/contexts/PreferencesContext";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import { navigationRef } from "./src/navigationRef";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import AddExpenseScreen from "./src/screens/AddExpenseScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import SetBudgetScreen from "./src/screens/SetBudgetScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ScheduledPaymentsScreen from "./src/screens/ScheduledPaymentsScreen";
import GoalsScreen from "./src/screens/GoalsScreen";

const Stack = createNativeStackNavigator();

function ShareIntentRouter() {
  const { hasShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (hasShareIntent && navigationRef.isReady()) {
      navigationRef.navigate("AddExpense");
    }
  }, [hasShareIntent]);

  return null;
}

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
          <Stack.Screen name="SetBudget" component={SetBudgetScreen} options={{ title: "Definir receita" }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Definições" }} />
          <Stack.Screen name="ScheduledPayments" component={ScheduledPaymentsScreen} options={{ title: "Pagamentos agendados" }} />
          <Stack.Screen name="Goals" component={GoalsScreen} options={{ title: "Metas e Objetivos" }} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ShareIntentProvider>
      <ThemeProvider>
        <PreferencesProvider>
          <AuthProvider>
            <NavigationContainer ref={navigationRef}>
              <StatusBar style="auto" />
              <ShareIntentRouter />
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </ShareIntentProvider>
  );
}