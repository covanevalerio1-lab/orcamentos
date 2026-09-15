import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as IntentLauncher from "expo-intent-launcher";
import { PermissionsAndroid, Platform as RNPlatform } from "react-native";
import { useAuth } from "../contexts/AuthContext";
importH{ usePreferences } from "../contexts/PreferencesContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  addScheduledPayment,
  listenScheduledPayments,
  deleteScheduledPayment,
} from "../services/scheduledPayments";
import { addExpense } from "../services/expenses";
import { scheduleReminder, cancelReminder, ensureNotificationPermission } from "../services/notifications";
import { CATEGORIES, getCategoryById } from "../constants/categories";

const defaultDueDate = () => new Date(Date.now() + 5 * 60 * 1000);

export default function ScheduledPaymentsScreen() {
  const { user } = useAuth();
  const { currency } = usePreferences();
  const { colors } = useTheme();

  const [payments, setPayments] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [recipientNumber, setRecipientNumber] = useState("");
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    return listenScheduledPayments(user.uid, setPayments);
  }, [user]);

  const resetForm = () => {
    setName("");
    setAmount("");
    setRecipientNumber("");
    setDueDate(defaultDueDate());
    setEditingId(null);
  };

  const handleAdd = async () => {
    const value = parseFloat(amount.replace(",", "."));
    if (!name.trim() || !value || value <= 0) {
      Alert.alert("Preenche o nome e um valor válido");
      return;
    }
    if (dueDate.getTime() <= Date.now()) {
      Alert.alert("Data inválida", "A data/hora escolhida já passou. Escolhe um momento no futuro.");
      return;
    }

    const granted = await ensureNotificationPermission();
    if (!granted) {
      Alert.alert(
        "Permissão necessária",
        "Ativa as notificações para este app nas definições do telemóvel para receberes o lembrete."
      );
    }

    setSaving(true);
    try {
      // Se estamos a editar, apaga primeiro o antigo (e o seu lembrete)
      if (editingId) {
        const old = payments.find((p) => p.id === editingId);
        if (old) await cancelReminder(old.notificationId);
        await deleteScheduledPayment(editingId);
      }

      const body = recipientNumber.trim()
        ? `${name} — ${value.toFixed(2)} ${currency} para ${recipientNumber.trim()} via M-Pesa`
        : `${name} — ${value.toFixed(2)} ${currency}`;

      const notificationId = await scheduleReminder({
        title: "Pagamento agendado",
        body,
        date: dueDate,
      });

      await addScheduledPayment(user.uid, {
        name: name.trim(),
        amount: value,
        categoryId,
        dueDate,
        notificationId,
        recipientNumber: recipientNumber.trim() || null,
      });
      resetForm();
    } catch (err) {
      Alert.alert("Erro", err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setAmount(String(item.amount));
    setRecipientNumber(item.recipientNumber || "");
    setCategoryId(item.categoryId);
    const d = item.dueDate?.toDate ? item.dueDate.toDate() : new Date(item.dueDate);
    setDueDate(d);
  };

  const handleDelete = (item) => {
    Alert.alert("Apagar pagamento agendado", `Apagar "${item.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          await cancelReminder(item.notificationId);
          await deleteScheduledPayment(item.id);
          if (editingId === item.id) resetForm();
        },
      },
    ]);
  };

  // Antes da data: toque mostra só Editar/Apagar.
  // Depois de chegar a data: toque abre as ações de concluir a transferência.
  const handleRowPress = (item) => {
    const d = item.dueDate?.toDate ? item.dueDate.toDate() : new Date(item.dueDate);
    const isDue = d.getTime() <= Date.now();

    if (!isDue) {
      Alert.alert(item.name, "Ainda não chegou a data agendada.", [
        { text: "Editar", onPress: () => startEdit(item) },
        { text: "Apagar", style: "destructive", onPress: () => handleDelete(item) },
        { text: "Fechar", style: "cancel" },
      ]);
      return;
    }

    const options = [];
    if (item.recipientNumber) {
      options.push({ text: "📞 Abrir M-Pesa", onPress: () => openMpesaTransfer() });
    }
    options.push({ text: "✓ Concluí a transferência", onPress: () => handleConfirmDone(item) });
    options.push({ text: "Editar", onPress: () => startEdit(item) });
    options.push({ text: "Apagar", style: "destructive", onPress: () => handleDelete(item) });
    options.push({ text: "Fechar", style: "cancel" });

    Alert.alert(item.name, "A data agendada já chegou.", options);
  };

  const openMpesaTransfer = async () => {
    try {
      if (RNPlatform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          {
            title: "Permissão para ligar",
            message: "A app precisa de permissão para marcar automaticamente o código M-Pesa.",
            buttonPositive: "Permitir",
            buttonNegative: "Cancelar",
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await IntentLauncher.startActivityAsync("android.intent.action.CALL", {
            data: "tel:*150*01%23",
          });
          return;
        }
      }
      // Sem permissão, ou não é Android: abre o discador para o utilizador marcar manualmente
      await Linking.openURL("tel:*150*01#");
    } catch (err) {
      try {
        await Linking.openURL("tel:*150#");
        Alert.alert("Nota", "Abri o menu principal do M-Pesa (*150#). Escolhe a opção 1 (Enviar dinheiro) para continuar.");
      } catch (err2) {
        Alert.alert("Não foi possível abrir o teclado de chamada", err2.message);
      }
    }
  };

  const handleConfirmDone = (item) => {
    Alert.alert(
      "Confirmar transferência",
      `Já concluíste a transferência de ${item.amount.toFixed(2)} ${currency}${item.recipientNumber ? ` para ${item.recipientNumber}` : ""} via M-Pesa?\n\nIsto vai registar automaticamente a despesa.`,
      [
        { text: "Ainda não", style: "cancel" },
        {
          text: "Sim, concluí",
          onPress: async () => {
            try {
              await addExpense(user.uid, {
                amount: item.amount,
                categoryId: item.categoryId,
                note: item.recipientNumber
                  ? `${item.name} — M-Pesa: ${item.recipientNumber}`
                  : item.name,
                date: new Date(),
              });
              await cancelReminder(item.notificationId);
              await deleteScheduledPayment(item.id);
              Alert.alert("✓", "Despesa registada com sucesso.");
            } catch (err) {
              Alert.alert("Erro", err.message);
            }
          },
        },
      ]
    );
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const merged = new Date(dueDate);
      merged.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDueDate(merged);
    }
  };

  const onChangeTime = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const merged = new Date(dueDate);
      merged.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      setDueDate(merged);
    }
  };

  const renderItem = ({ item }) => {
    const cat = getCategoryById(item.categoryId);
    const date = item.dueDate?.toDate ? item.dueDate.toDate() : new Date(item.dueDate);
    const isDue = date.getTime() <= Date.now();
    return (
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.card }, editingId === item.id && styles.rowEditing]}
        onPress={() => handleRowPress(item)}
      >
        <View style={[styles.iconCircle, { backgroundColor: cat.color }]}>
          <Text style={styles.icon}>{cat.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.rowDate, { color: colors.textSecondary }]}>
            {date.toLocaleDateString("pt-PT")} {date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
            {isDue ? " · ⏰ hoje" : " · 🔔 agendado"}
          </Text>
          {!!item.recipientNumber && (
            <Text style={[styles.rowRecipient, { color: colors.textSecondary }]}>
              📱 Para: {item.recipientNumber}
            </Text>
          )}
        </View>
        <Text style={styles.rowAmount}>{item.amount.toFixed(2)} {currency}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={{ padding: 20, paddingBottom: 4 }}>
        {payments.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Ainda não tens pagamentos agendados.
          </Text>
        ) : (
          payments.map((item) => <View key={item.id}>{renderItem({ item })}</View>)
        )}
      </View>

      <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.formTitle, { color: colors.text }]}>
          {editingId ? "Editar pagamento agendado" : "Novo pagamento agendado"}
        </Text>

        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Nome (ex: Renda, Netflix)"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder={`Valor (${currency})`}
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Número M-Pesa de destino (opcional)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          value={recipientNumber}
          onChangeText={setRecipientNumber}
        />

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
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={[styles.dateButton, { flex: 1 }]} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>📅 {dueDate.toLocaleDateString("pt-PT")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dateButton, { flex: 1 }]} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.dateButtonText}>
              🕐 {dueDate.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()}
            onChange={onChangeDate}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={dueDate}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onChangeTime}
          />
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleAdd} disabled={saving}>
          <Text style={styles.saveButtonText}>
            {saving ? "A guardar..." : editingId ? "Atualizar pagamento" : "Agendar pagamento"}
          </Text>
        </TouchableOpacity>

        {editingId && (
          <TouchableOpacity style={styles.cancelEditButton} onPress={resetForm}>
            <Text style={styles.cancelEditButtonText}>Cancelar edição</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowEditing: { borderWidth: 2, borderColor: "#6366F1" },
  iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", marginRight: 12 },
  icon: { fontSize: 16 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowDate: { fontSize: 12, marginTop: 2 },
  rowRecipient: { fontSize: 12, marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: "700", color: "#EF4444" },
  empty: { textAlign: "center", marginTop: 20 },
  form: {
    borderTopWidth: 1,
    padding: 16,
    paddingBottom: 24,
  },
  formTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    fontSize: 14,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  categoryChip: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIcon: { fontSize: 16 },
  dateButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  dateButtonText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  saveButton: {
    backgroundColor: "#10B981",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "600" },
  cancelEditButton: { marginTop: 8, alignItems: "center", padding: 8 },
  cancelEditButtonText: { color: "#6366F1", fontWeight: "600" },
})