import React, { useEffect, useState, useMemo, useLayoutEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useTheme } from "../contexts/ThemeContext";
import { listenExpenses, listenBudget, getMonthKey } from "../services/expenses";
import { listenScheduledPayments } from "../services/scheduledPayments";
import { listenGoals } from "../services/goals";
import { getCategoryById, CATEGORIES } from "../constants/categories";
import SideMenu from "../components/SideMenu";

const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { t, currency } = usePreferences();
  const { colors, customImageUri, mode } = useTheme();
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(null);
  const [scheduledPayments, setScheduledPayments] = useState([]);
  const [goals, setGoals] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);

  const monthKey = getMonthKey();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ paddingHorizontal: 12 }}>
          <Text style={{ fontSize: 22 }}>☰</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const unsubExpenses = listenExpenses(user.uid, start, end, setExpenses);
    const unsubBudget = listenBudget(user.uid, monthKey, setBudget);
    const unsubScheduled = listenScheduledPayments(user.uid, setScheduledPayments);
    const unsubGoals = listenGoals(user.uid, setGoals);

    return () => {
      unsubExpenses();
      unsubBudget();
      unsubScheduled();
      unsubGoals();
    };
  }, [user, monthKey]);

  const receita = budget?.total || 0;
  const poupanca = budget?.savings || 0;
  const saldoDisponivel = budget?.spendable ?? (receita - poupanca);

  const despesaMes = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const despesasPlaneadas = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return scheduledPayments
      .filter((p) => {
        const d = p.dueDate?.toDate ? p.dueDate.toDate() : new Date(p.dueDate);
        return d >= start && d <= end;
      })
      .reduce((sum, p) => sum + p.amount, 0);
  }, [scheduledPayments]);

  // Total já depositado em metas — dinheiro reservado, já não disponível para gastar
  const totalDepositadoMetas = useMemo(
    () => goals.reduce((sum, g) => sum + (g.savedAmount || 0), 0),
    [goals]
  );

  // Saldo atual = disponível - despesas feitas - despesas planeadas - depósitos em metas
  const saldoAtual = saldoDisponivel - despesaMes - despesasPlaneadas - totalDepositadoMetas;

  const totalUsado = despesaMes + despesasPlaneadas + totalDepositadoMetas;
  const percentagem = saldoDisponivel > 0 ? Math.min(totalUsado / saldoDisponivel, 1) : 0;

  const chartData = useMemo(() => {
    const byCategory = {};
    expenses.forEach((e) => {
      byCategory[e.categoryId] = (byCategory[e.categoryId] || 0) + e.amount;
    });
    const slices = Object.entries(byCategory).map(([catId, value]) => {
      const cat = getCategoryById(catId);
      return {
        name: cat.label,
        population: value,
        color: cat.color,
        legendFontColor: colors.text,
        legendFontSize: 12,
      };
    });
    if (totalDepositadoMetas > 0) {
      slices.push({
        name: "Metas",
        population: totalDepositadoMetas,
        color: "#0D9488",
        legendFontColor: colors.text,
        legendFontSize: 12,
      });
    }
    return slices;
  }, [expenses, colors, totalDepositadoMetas]);

  const Wrapper = ({ children }) =>
    mode === "custom" && customImageUri ? (
      <ImageBackground
        source={{ uri: customImageUri }}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.35 }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}>{children}</View>
      </ImageBackground>
    ) : (
      <View style={{ flex: 1, backgroundColor: colors.background }}>{children}</View>
    );

  return (
    <>
      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />

      <Wrapper>
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.greeting, { color: colors.text }]}>{t("hello")} 👋</Text>
            <TouchableOpacity onPress={logout}>
              <Text style={styles.logout}>{t("exit")}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Saldo atual</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{saldoAtual.toFixed(2)} {currency}</Text>

            {receita > 0 ? (
              <TouchableOpacity onPress={() => navigation.navigate("SetBudget")}>
                <Text style={[styles.summarySub, { color: colors.textSecondary }]}>
                  {`Receita: ${receita.toFixed(2)} ${currency} · Disponível: ${saldoDisponivel.toFixed(2)} ${currency}  (${t("edit")})`}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => navigation.navigate("SetBudget")}>
                <Text style={styles.summarySubLink}>{t("setBudget")}</Text>
              </TouchableOpacity>
            )}

            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${percentagem * 100}%`,
                    backgroundColor: percentagem >= 1 ? "#EF4444" : colors.accent,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={[styles.breakdownCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{t("expenseThisMonth")}</Text>
              <Text style={styles.breakdownValueExpense}>{despesaMes.toFixed(2)} {currency}</Text>
            </View>
            <View style={[styles.breakdownCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{t("plannedExpenses")}</Text>
              <Text style={styles.breakdownValuePlanned}>{despesasPlaneadas.toFixed(2)} {currency}</Text>
            </View>
          </View>

          {totalDepositadoMetas > 0 && (
            <View style={styles.goalsCard}>
              <Text style={styles.goalsIcon}>🎯</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalsLabel}>Depositado em metas</Text>
                <Text style={styles.goalsValue}>{totalDepositadoMetas.toFixed(2)} {currency}</Text>
              </View>
            </View>
          )}

          {poupanca > 0 && (
            <View style={styles.savingsCard}>
              <Text style={styles.savingsIcon}>💰</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.savingsLabel}>{t("savingsThisMonth")}</Text>
                <Text style={styles.savingsValue}>{poupanca.toFixed(2)} {currency}</Text>
              </View>
            </View>
          )}

          {chartData.length > 0 && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("expensesByCategory")}</Text>
              <PieChart
                data={chartData}
                width={screenWidth - 48}
                height={200}
                chartConfig={{ color: () => colors.text }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="8"
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate("AddExpense")}
          >
            <Text style={styles.addButtonText}>{t("addExpense")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("History")}
          >
            <Text style={styles.secondaryButtonText}>{t("viewHistory")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Wrapper>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: "700" },
  logout: { color: "#EF4444", fontSize: 14 },
  summaryCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 28, fontWeight: "700", marginVertical: 4 },
  summarySub: { fontSize: 13, marginBottom: 12 },
  summarySubLink: { color: "#6366F1", fontSize: 13, marginBottom: 12, fontWeight: "600" },
  progressBarBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
  breakdownRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  breakdownCard: { flex: 1, borderRadius: 14, padding: 14 },
  breakdownLabel: { fontSize: 12, marginBottom: 4 },
  breakdownValueExpense: { fontSize: 16, fontWeight: "700", color: "#EF4444" },
  breakdownValuePlanned: { fontSize: 16, fontWeight: "700", color: "#F59E0B" },
  goalsCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  goalsIcon: { fontSize: 24, marginRight: 12 },
  goalsLabel: { fontSize: 13, color: "#92400E" },
  goalsValue: { fontSize: 18, fontWeight: "700", color: "#92400E" },
  savingsCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  savingsIcon: { fontSize: 24, marginRight: 12 },
  savingsLabel: { fontSize: 13, color: "#065F46" },
  savingsValue: { fontSize: 18, fontWeight: "700", color: "#065F46" },
  chartCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  addButton: { borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 12 },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  secondaryButton: { padding: 12, alignItems: "center" },
  secondaryButtonText: { color: "#6366F1", fontWeight: "600" },
});