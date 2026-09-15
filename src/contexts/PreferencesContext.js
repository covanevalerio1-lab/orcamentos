import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations } from "../i18n/translations";

const PreferencesContext = createContext(null);

const STORAGE_KEY = "@orcamento_preferences";

export function PreferencesProvider({ children }) {
  const [language, setLanguageState] = useState("pt");
  const [currency, setCurrencyState] = useState("MT");
  const [mpesaNumber, setMpesaNumberState] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.language) setLanguageState(parsed.language);
          if (parsed.currency) setCurrencyState(parsed.currency);
          if (parsed.mpesaNumber) setMpesaNumberState(parsed.mpesaNumber);
        }
      } catch (e) {
        // ignora, usa valores por omissão
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = async (next) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      // ignora falha de guardar
    }
  };

  const setLanguage = (lang) => {
    setLanguageState(lang);
    persist({ language: lang, currency, mpesaNumber });
  };

  const setCurrency = (curr) => {
    setCurrencyState(curr);
    persist({ language, currency: curr, mpesaNumber });
  };

  const setMpesaNumber = (num) => {
    setMpesaNumberState(num);
    persist({ language, currency, mpesaNumber: num });
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.pt[key] || key;
  };

  return (
    <PreferencesContext.Provider
      value={{ language, setLanguage, currency, setCurrency, mpesaNumber, setMpesaNumber, t, loaded }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences deve ser usado dentro de PreferencesProvider");
  return ctx;
}