import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { setBudget, getMonthKey } from "../services/expenses";

const SAVINGS_RATE = 0.1;

export default function SetBudgetScreen({ navigation }) {
  const { user } = useAuth();
  const { currency, t } = usePreferences();
  const [total, setTotal] = useState("");
  const [saving, setSaving] = useState(false);

  const totalNum = parseFloat(total.replace(",", ".")) || 0;
  const savingsPreview = useMemo(() => totalNum * SAVINGS_RATE, [totalNum]);
  const availablePreview = useMemo(() => totalNum - savingsPreview, [totalNum, savingsPreview]);

  const handleSave = async () => {
    if (!totalNum || totalNum <= 0) {
      Alert.alert("Insere um valor válido");
      return;
    }
    setSaving(true);
    try {
      await setBudget(user.uid, getMonthKey(), { total: totalNum, byCategory: {} });
      navigation.goBack();
    } catch (err) {
      Alert.alert("Erro", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Receita do mês ({currency})</Text>
      <TextInput
        style={styles.amountInput}
        placeholder="0,00"
        keyboardType="decimal-pad"
        value={total}
        onChangeText={setTotal}
        autoFocus
      />
      <Text style={styles.hint}>
        10% desta receita é reservado automaticamente como poupança. O restante fica disponível para gastar no mês.
      </Text>

      {totalNum > 0 && (
        <View style={styles.previewCard}>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>💰 Poupança (10%)</Text>
            <Text style={styles.previewValue}>{savingsPreview.toFixed(2)} {currency}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>💳 Saldo disponível</Text>
            <Text style={styles.previewValueMain}>{availablePreview.toFixed(2)} {currency}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? "A guardar..." : "Guardar receita"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 16, marginBottom: 8 },
  amountInput: {
    fontSize: 32,
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: "#10B981",
    paddingVertical: 8,
  },
  hint: { fontSize: 13, color: "#9CA3AF", marginTop: 12 },
  previewCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  previewLabel: { fontSize: 14, color: "#374151" },
  previewValue: { fontSize: 14, fontWeight: "600", color: "#374151" },
  previewValueMain: { fontSize: 16, fontWeight: "700", color: "#10B981" },
  saveButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 28,
  },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});