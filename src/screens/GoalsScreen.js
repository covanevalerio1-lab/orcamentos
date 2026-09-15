import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useTheme } from "../contexts/ThemeContext";
import { addGoal, listenGoals, addDepositToGoal, deleteGoal } from "../services/goals";

const defaultDeadline = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d;
};

export default function GoalsScreen() {
  const { user } = useAuth();
  const { currency } = usePreferences();
  const { colors } = useTheme();

  const [goals, setGoals] = useState([]);

  // Formulário de nova meta
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal de depósito
  const [depositGoal, setDepositGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");

  useEffect(() => {
    if (!user) return;
    return listenGoals(user.uid, setGoals);
  }, [user]);

  const handleAddGoal = async () => {
    const value = parseFloat(targetAmount.replace(",", "."));
    if (!title.trim() || !value || value <= 0) {
      Alert.alert("Preenche o objetivo e um valor alvo válido");
      return;
    }
    setSaving(true);
    try {
      await addGoal(user.uid, {
        title: title.trim(),
        description: description.trim(),
        targetAmount: value,
        deadline,
      });
      setTitle("");
      setDescription("");
      setTargetAmount("");
      setDeadline(defaultDeadline());
    } catch (err) {
      Alert.alert("Erro", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeposit = async () => {
    const value = parseFloat(depositAmount.replace(",", "."));
    if (!value || value <= 0) {
      Alert.alert("Insere um valor válido");
      return;
    }
    try {
      await addDepositToGoal(depositGoal.id, value);
      setDepositGoal(null);
      setDepositAmount("");
    } catch (err) {
      Alert.alert("Erro", err.message);
    }
  };

  const handleDeleteGoal = (goal) => {
    Alert.alert("Apagar meta", `Apagar "${goal.title}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: () => deleteGoal(goal.id) },
    ]);
  };

  const renderGoal = ({ item }) => {
    const progress = item.targetAmount > 0 ? Math.min(item.savedAmount / item.targetAmount, 1) : 0;
    const done = progress >= 1;
    const deadlineDate = item.deadline?.toDate ? item.deadline.toDate() : new Date(item.deadline);
    return (
      <TouchableOpacity
        style={[styles.goalCard, { backgroundColor: colors.card }]}
        onLongPress={() => handleDeleteGoal(item)}
      >
        <View style={styles.goalHeader}>
          <Text style={[styles.goalTitle, { color: colors.text }]}>
            {done ? "🎉 " : "🎯 "}{item.title}
          </Text>
          <Text style={[styles.goalDeadline, { color: colors.textSecondary }]}>
            até {deadlineDate.toLocaleDateString("pt-PT")}
          </Text>
        </View>

        {!!item.description && (
          <Text style={[styles.goalDescription, { color: colors.textSecondary }]}>{item.description}</Text>
        )}

        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progress * 100}%`, backgroundColor: done ? "#F59E0B" : "#10B981" },
            ]}
          />
        </View>

        <View style={styles.goalFooter}>
          <Text style={[styles.goalAmounts, { color: colors.textSecondary }]}>
            {item.savedAmount.toFixed(2)} / {item.targetAmount.toFixed(2)} {currency} ({Math.round(progress * 100)}%)
          </Text>
          {!done && (
            <TouchableOpacity
              style={styles.depositButton}
              onPress={() => {
                setDepositGoal(item);
                setDepositAmount("");
              }}
            >
              <Text style={styles.depositButtonText}>+ Depositar</Text>
            </TouchableOpacity>
          )}
        </View>

        {done && (
          <View style={styles.doneBanner}>
            <Text style={styles.doneBannerText}>Meta concluída! Podes: {item.title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={renderGoal}
        contentContainerStyle={{ padding: 20, paddingBottom: 4 }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Ainda não tens metas definidas.
          </Text>
        }
      />

      <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.formTitle, { color: colors.text }]}>Nova meta</Text>

        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Objetivo (ex: Comprar um computador)"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Descrição (opcional)"
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder={`Valor alvo (${currency})`}
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={targetAmount}
          onChangeText={setTargetAmount}
        />

        <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
          <Text style={styles.dateButtonText}>📅 Prazo: {deadline.toLocaleDateString("pt-PT")}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={deadline}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowPicker(Platform.OS === "ios");
              if (selectedDate) setDeadline(selectedDate);
            }}
          />
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleAddGoal} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? "A guardar..." : "Criar meta"}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de depósito */}
      <Modal visible={!!depositGoal} transparent animationType="slide" onRequestClose={() => setDepositGoal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Depositar em "{depositGoal?.title}"</Text>
            <TextInput
              style={styles.numberInput}
              placeholder={`Valor (${currency})`}
              keyboardType="decimal-pad"
              value={depositAmount}
              onChangeText={setDepositAmount}
              autoFocus
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleDeposit}>
              <Text style={styles.saveButtonText}>Confirmar depósito</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setDepositGoal(null)}>
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  goalCard: { borderRadius: 14, padding: 16, marginBottom: 12 },
  goalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  goalTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  goalDeadline: { fontSize: 11 },
  goalDescription: { fontSize: 13, marginBottom: 10 },
  progressBarBg: { height: 10, borderRadius: 5, overflow: "hidden", marginTop: 8 },
  progressBarFill: { height: "100%", borderRadius: 5 },
  goalFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  goalAmounts: { fontSize: 12, fontWeight: "600" },
  depositButton: { backgroundColor: "#10B981", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  depositButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  doneBanner: { backgroundColor: "#FEF3C7", borderRadius: 8, padding: 10, marginTop: 10 },
  doneBannerText: { color: "#92400E", fontSize: 13, fontWeight: "600" },
  empty: { textAlign: "center", marginTop: 20 },
  form: { borderTopWidth: 1, padding: 16, paddingBottom: 24 },
  formTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8, fontSize: 14 },
  dateButton: { backgroundColor: "#F3F4F6", borderRadius: 10, padding: 12, marginBottom: 10, alignItems: "center" },
  dateButtonText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  saveButton: { backgroundColor: "#10B981", borderRadius: 10, padding: 14, alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "600" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  numberInput: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 12 },
  closeButton: { marginTop: 8, paddingVertical: 12, alignItems: "center" },
  closeButtonText: { color: "#6366F1", fontWeight: "600" },
});