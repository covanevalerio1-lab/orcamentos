import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

const MENU_WIDTH = Math.min(280, Dimensions.get("window").width * 0.75);

export default function SideMenu({ visible, onClose, navigation }) {
  const { user, logout } = useAuth();
  const translateX = useRef(new Animated.Value(-MENU_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -MENU_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const goTo = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[styles.menu, { transform: [{ translateX }] }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Orçamento</Text>
            {!!user?.email && <Text style={styles.email}>{user.email}</Text>}
          </View>

          <TouchableOpacity style={styles.item} onPress={() => goTo("Dashboard")}>
            <Text style={styles.itemIcon}>🏠</Text>
            <Text style={styles.itemLabel}>Início</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => goTo("History")}>
            <Text style={styles.itemIcon}>📋</Text>
            <Text style={styles.itemLabel}>Histórico</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => goTo("Goals")}>
            <Text style={styles.itemIcon}>🎯</Text>
            <Text style={styles.itemLabel}>Metas e Objetivos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => goTo("ScheduledPayments")}>
            <Text style={styles.itemIcon}>📅</Text>
            <Text style={styles.itemLabel}>Pagamentos agendados</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => goTo("Settings")}>
            <Text style={styles.itemIcon}>⚙️</Text>
            <Text style={styles.itemLabel}>Definições</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={styles.logoutItem}
            onPress={() => {
              onClose();
              logout();
            }}
          >
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", flexDirection: "row" },
  menu: {
    width: MENU_WIDTH,
    backgroundColor: "#fff",
    height: "100%",
  },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", marginBottom: 8, marginTop: 30 },
  title: { fontSize: 20, fontWeight: "700" },
  email: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 20 },
  itemIcon: { fontSize: 18, marginRight: 14 },
  itemLabel: { fontSize: 15, color: "#111827", fontWeight: "500" },
  logoutItem: { padding: 20, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  logoutText: { color: "#EF4444", fontWeight: "600" },
});