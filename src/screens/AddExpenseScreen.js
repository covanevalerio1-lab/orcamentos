import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useShareIntentContext } from "expo-share-intent";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { addExpense } from "../services/expenses";
import { CATEGORIES } from "../constants/categories";
import { parseMpesaSms } from "../services/mpesaParser";

export default function AddExpenseScreen({ navigation }) {
  const { user } = useAuth();
  const { currency } = usePreferences();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [fromMpesa, setFromMpesa] = useState(false);
  const [pasteText, setPasteText] = useState("");

  useEffect(() => {
    if (hasShareIntent && shareIntent?.text) {
      applyMpesaText(shareIntent.text);
      resetShareIntent();
    }
  }, [hasShareIntent, shareIntent]);

  function applyMpesaText(text) {
    const parsed = parseMpesaSms(text);
    if (!parsed) {
      Alert.alert(
        "Não foi possível reconhecer",
        "O texto não parece ser um SMS de confirmação do M-Pesa. Podes preencher os campos à mão."
      );
      return;
    }
    setAmount(String(parsed.amount));
    setDate(parsed.date);
    setNote(parsed.recipient ? `M-Pesa: ${parsed.recipient}` : "M-Pesa");
    setFromMpesa(true);
  }

  const handleSave = async () => {
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) {
      Alert.alert("Insere um valor válido");
      return;
    }
    setSaving(true);
    try {
      await addExpense(user.uid, {
        amount: value,
        categoryId,
        note,
        date,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert("Erro", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {fromMpesa && (
        <View style={styles.mpesaBanner}>
          <Text style={styles.mpesaBannerText}>
            ✓ Dados preenchidos automaticamente a partir de um SMS do M-Pesa
          </Text>
        </View>
      )}

      <Text style={styles.label}>Colar SMS do M-Pesa (opcional)</Text>
      <View style={styles.pasteRow}>
        <TextInput
          style={styles.pasteInput}
          placeholder="Cola aqui o texto do SMS de confirmação..."
          multiline
          value={pasteText}
          onChangeText={setPasteText}
        />
        <TouchableOpacity
          style={styles.pasteButton}
          onPress={() => {
            if (pasteText.trim()) applyMpesaText(pasteText);
          }}
        >
          <Text style={styles.pasteButtonText}>Ler</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        Dica: no telemóvel, seleciona o SMS do M-Pesa e usa "Partilhar → Orçamento" em vez de colar aqui.
      </Text>

      <Text style={styles.label}>Valor ({currency})</Text>
      <TextInput
        style={styles.amountInput}
        placeholder="0,00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Categoria</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              categoryId === cat.id && { backgroundColor: cat.color },
            ]}
            onPress={() => setCategoryId(cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.categoryLabel,
                categoryId === cat.id && { color: "#fff" },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Nota (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Almoço com colegas"
        value={note}
        onChangeText={setNote}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? "A guardar..." : "Guardar gasto"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 16, marginBottom: 8 },
  amountInput: {
    fontSize: 36,
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: "#10B981",
    paddingVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryLabel: { fontSize: 14, color: "#374151" },
  saveButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 28,
    marginBottom: 40,
  },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  mpesaBanner: {
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  mpesaBannerText: { color: "#065F46", fontSize: 13, fontWeight: "600" },
  pasteRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  pasteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    minHeight: 60,
  },
  pasteButton: {
    backgroundColor: "#6366F1",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  pasteButtonText: { color: "#fff", fontWeight: "600" },
  hint: { fontSize: 12, color: "#9CA3AF", marginTop: 6 },
});