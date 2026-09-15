import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export async function addGoal(userId, { title, description, targetAmount, deadline }) {
  return addDoc(collection(db, "goals"), {
    userId,
    title,
    description: description || "",
    targetAmount: Number(targetAmount),
    savedAmount: 0,
    deadline: Timestamp.fromDate(deadline),
    createdAt: Timestamp.now(),
  });
}

export function listenGoals(userId, callback) {
  const q = query(
    collection(db, "goals"),
    where("userId", "==", userId),
    orderBy("deadline", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

export async function addDepositToGoal(goalId, amount) {
  const ref = doc(db, "goals", goalId);
  return updateDoc(ref, { savedAmount: increment(Number(amount)) });
}

export async function deleteGoal(goalId) {
  return deleteDoc(doc(db, "goals", goalId));
}