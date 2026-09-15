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
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export async function addScheduledPayment(userId, { name, amount, categoryId, dueDate, notificationId, recipientNumber }) {
  return addDoc(collection(db, "scheduledPayments"), {
    userId,
    name,
    amount: Number(amount),
    categoryId,
    dueDate: Timestamp.fromDate(dueDate),
    notificationId: notificationId || null,
    recipientNumber: recipientNumber || null,
    createdAt: Timestamp.now(),
  });
}

export function listenScheduledPayments(userId, callback) {
  const q = query(
    collection(db, "scheduledPayments"),
    where("userId", "==", userId),
    orderBy("dueDate", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

export async function deleteScheduledPayment(id) {
  return deleteDoc(doc(db, "scheduledPayments", id));
}