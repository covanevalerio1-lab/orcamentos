import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// --- Gastos ---

export async function addExpense(userId, { amount, categoryId, note, date }) {
  return addDoc(collection(db, "expenses"), {
    userId,
    amount: Number(amount),
    categoryId,
    note: note || "",
    date: Timestamp.fromDate(date || new Date()),
    createdAt: Timestamp.now(),
  });
}

export function listenExpenses(userId, startDate, endDate, callback) {
  const q = query(
    collection(db, "expenses"),
    where("userId", "==", userId),
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<=", Timestamp.fromDate(endDate)),
    orderBy("date", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(expenses);
  });
}

export async function deleteExpense(expenseId) {
  return deleteDoc(doc(db, "expenses", expenseId));
}

// Apaga todos os gastos de um utilizador dentro de um intervalo de datas
// (usado para "Limpar histórico" no mês atual)
export async function clearExpenses(userId, startDate, endDate) {
  const q = query(
    collection(db, "expenses"),
    where("userId", "==", userId),
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<=", Timestamp.fromDate(endDate))
  );
  const snapshot = await getDocs(q);
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
}

// --- Orçamento mensal ---

const SAVINGS_RATE = 0.1;

export async function setBudget(userId, monthKey, { total, byCategory }) {
  const totalNum = Number(total);
  const savings = totalNum * SAVINGS_RATE;
  const spendable = totalNum - savings;
  const ref = doc(db, "budgets", `${userId}_${monthKey}`);
  return setDoc(
    ref,
    {
      userId,
      monthKey,
      total: totalNum,
      savings,
      spendable,
      byCategory: byCategory || {},
    },
    { merge: true }
  );
}

export function listenBudget(userId, monthKey, callback) {
  const ref = doc(db, "budgets", `${userId}_${monthKey}`);
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}