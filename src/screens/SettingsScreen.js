import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, FlatList, TextInput, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { usePreferences } from "../contexts/PreferencesContext";
import { useTheme } from "../contexts/ThemeContext";
import { LANGUAGES, CURRENCIES } from "../i18n/translations";

export default function SettingsScreen({ navigation }) {
  const { language, setLanguage, currency, setCurrency, mpesaNumber, setMpesaNumber, t } = usePreferences();
  const { mode, setMode, setCustomImageUri, colors } = useTheme();
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [currModalOpen, setCurrModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [numberModalOpen, setNumberModalOpen] = useState(false);
  const [numberDraft, setNumberDraft] = useState(mpesaNumber);

  const currentLangLabel = LANGUAGES.find((l) => l.code === language)?.label || language;
  const currentCurrLabel = CURRENCIES.find((c) => c.code === currency)?.label || currency;
  const currentThemeLabel =
    mode === "dark" ? "Escuro" : mode === "custom" ? "Imagem personalizada" : "Claro";

  const pickCustomImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Precisamos de acesso à galeria para escolheres uma imagem.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setCustomImageUri(result.assets[0].uri);
      setThemeModalOpen(false);
    }
  };

  const saveNumber = () => {
    setMpesaNumber(numberDraft.trim());
    setNumberModalOpen(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t("settings")}</Text>

      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.card }]}
        onPress={() => {
          setNumberDraft(mpesaNumber);
          setNumberModalOpen(true);
        }}
      >
        <Text style={styles.icon}>📱</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: colors.text }]}>Número M-Pesa</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            {mpesaNumber || "Ainda não definido"}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.row, { backgroundColor: colors.card }]} onPress={() => setLangModalOpen(true)}>
        <Text style={styles.icon}>🌐</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: colors.text }]}>{t("language")}</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{currentLangLabel}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.row, { backgroundColor: colors.card }]} onPress={() => setCurrModalOpen(true)}>
        <Text style={styles.icon}>💱</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: colors.text }]}>{t("currency")}</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{currentCurrLabel}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.row, { backgroundColor: colors.card }]} onPress={() => setThemeModalOpen(true)}>
        <Text style={styles.icon}>🎨</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: colors.text }]}>Tema</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{currentThemeLabel}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.row, { backgroundColor: colors.card }]} disabled>
        <Text style={styles.icon}>🔔</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: colors.text }]}>Notificações</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>Ativas para pagamentos agendados</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate("ScheduledPayments")}
      >
        <Text style={styles.icon}>📅</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: colors.text }]}>Pagamentos agendados</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>Configurar lembretes de pagamento</Text>
        </View>
      </TouchableOpacity>

      {/* Editar número M-Pesa */}
      <Modal visible={numberModalOpen} transparent animationType="slide" onRequestClose={() => setNumberModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Número M-Pesa</Text>
            <TextInput
              style={styles.numberInput}
              placeholder="Ex: 84 123 4567"
              keyboardType="phone-pad"
              value={numberDraft}
              onChangeText={setNumberDraft}
              autoFocus
            />
            <TouchableOpacity style={styles.saveNumberButton} onPress={saveNumber}>
              <Text style={styles.saveNumberButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setNumberModalOpen(false)}>
              <Text style={styles.closeButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Seletor de idioma */}
      <Modal visible={langModalOpen} transparent animationType="slide" onRequestClose={() => setLangModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t("language")}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    setLanguage(item.code);
                    setLangModalOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.code === language && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setLangModalOpen(false)}>
              <Text style={styles.closeButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Seletor de moeda */}
      <Modal visible={currModalOpen} transparent animationType="slide" onRequestClose={() => setCurrModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t("currency")}</Text>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    setCurrency(item.code);
                    setCurrModalOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.code === currency && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setCurrModalOpen(false)}>
              <Text style={styles.closeButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Seletor de tema */}
      <Modal visible={themeModalOpen} transparent animationType="slide" onRequestClose={() => setThemeModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Tema</Text>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                setMode("light");
                setThemeModalOpen(false);
              }}
            >
              <Text style={styles.optionText}>☀️ Claro</Text>
              {mode === "light" && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                setMode("dark");
                setThemeModalOpen(false);
              }}
            >
              <Text style={styles.optionText}>🌙 Escuro</Text>
              {mode === "dark" && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow} onPress={pickCustomImage}>
              <Text style={styles.optionText}>🖼️ Escolher imagem da galeria</Text>
              {mode === "custom" && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => setThemeModalOpen(false)}>
              <Text style={styles.closeButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  icon: { fontSize: 22, marginRight: 14 },
  label: { fontSize: 15, fontWeight: "600" },
  desc: { fontSize: 12, marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionText: { fontSize: 15, color: "#111827" },
  checkmark: { fontSize: 16, color: "#10B981", fontWeight: "700" },
  closeButton: { marginTop: 12, paddingVertical: 14, alignItems: "center" },
  closeButtonText: { color: "#6366F1", fontWeight: "600" },
  numberInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  saveNumberButton: { backgroundColor: "#10B981", borderRadius: 10, padding: 14, alignItems: "center" },
  saveNumberButtonText: { color: "#fff", fontWeight: "600" },
});