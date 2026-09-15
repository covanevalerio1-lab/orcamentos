import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useTheme } from "../contexts/ThemeContext";
import { listenExpenses, deleteExpense, clearExpenses, getMonthKey } from "../services/expenses";
import { getCategoryById } from "../constants/categories";

export default function HistoryScreen() {
  const { user } = useAuth();
  const { t, currency } = usePreferences();
  const { colors } = useTheme();
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return listenExpenses(user.uid, start, end, setExpenses);
  }, [user]);

  const handleDeleteOne = (item) => {
    Alert.alert(
      t("delete"),
      `${getCategoryById(item.categoryId).label} (${item.amount.toFixed(2)} ${currency})?`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => {
            deleteExpense(item.id).catch((err) => Alert.alert("Erro", err.message));
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (expenses.length === 0) return;
    Alert.alert(
      t("clearHistory"),
      "Isto vai apagar TODOS os gastos deste mês. Esta ação não pode ser desfeita.",
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("clearHistory"),
          style: "destructive",
          onPress: async () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            try {
              await clearExpenses(user.uid, start, end);
              Alert.alert("✓", "Histórico limpo com sucesso.");
            } catch (err) {
              Alert.alert("Erro ao limpar", err.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const cat = getCategoryById(item.categoryId);
    const date = item.date?.toDate ? item.date.toDate() : new Date(item.date);
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: colors.border }]}
        onLongPress={() => handleDeleteOne(item)}
      >
        <View style={[styles.iconCircle, { backgroundColor: cat.color }]}>
          <Text style={styles.icon}>{cat.icon}</Text>
        </View>
        <View style={styles.rowMiddle}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{cat.label}</Text>
          {!!item.note && <Text style={[styles.rowNote, { color: colors.textSecondary }]}>{item.note}</Text>}
          <Text style={[styles.rowDate, { color: colors.textSecondary }]}>
            {date.toLocaleDateString("pt-PT")}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.rowAmount}>-{item.amount.toFixed(2)} {currency}</Text>
          <Text style={[styles.deleteHint, { color: colors.textSecondary }]}>{t("holdToDelete")}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {expenses.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
          <Text style={styles.clearButtonText}>{t("clearHistory")}</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>{t("noExpensesYet")}</Text>
        }
        contentContainerStyle={{ padding: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  clearButton: {
    margin: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  clearButtonText: { color: "#EF4444", fontSize: 14, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12 },
  icon: { fontSize: 18 },
  rowMiddle: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowNote: { fontSize: 13 },
  rowDate: { fontSize: 12, marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: "700", color: "#EF4444" },
  deleteHint: { fontSize: 10, marginTop: 2 },
  empty: { textAlign: "center", marginTop: 40 },
});