import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDqXj85Aoxv9ZlYxE9nombinQdJMQeRHxQ",
  authDomain: "orcamento-88094.firebaseapp.com",
  projectId: "orcamento-88094",
  storageBucket: "orcamento-88094.firebasestorage.app",
  messagingSenderId: "352645138510",
  appId: "1:352645138510:web:1e1bb283f4c436311e5b1f",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export default app;
