import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useAuth } from "../contexts/AuthContext";

export default function CustomDrawer(props) {
  const { user, logout } = useAuth();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Orçamento</Text>
        {!!user?.email && <Text style={styles.email}>{user.email}</Text>}
      </View>

      <TouchableOpacity
        style={styles.item}
        onPress={() => props.navigation.navigate("Dashboard")}
      >
        <Text style={styles.itemIcon}>🏠</Text>
        <Text style={styles.itemLabel}>Início</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => props.navigation.navigate("History")}
      >
        <Text style={styles.itemIcon}>📋</Text>
        <Text style={styles.itemLabel}>Histórico</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => props.navigation.navigate("Settings")}
      >
        <Text style={styles.itemIcon}>⚙️</Text>
        <Text style={styles.itemLabel}>Definições</Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.logoutItem} onPress={logout}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  email: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 20 },
  itemIcon: { fontSize: 18, marginRight: 14 },
  itemLabel: { fontSize: 15, color: "#111827", fontWeight: "500" },
  logoutItem: { padding: 20, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  logoutText: { color: "#EF4444", fontWeight: "600" },
});