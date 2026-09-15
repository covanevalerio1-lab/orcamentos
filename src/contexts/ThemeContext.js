import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext(null);
const STORAGE_KEY = "@orcamento_theme";

const PALETTES = {
  light: {
    background: "#F9FAFB",
    card: "#FFFFFF",
    text: "#111827",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    accent: "#10B981",
    statusBar: "dark",
  },
  dark: {
    background: "#111827",
    card: "#1F2937",
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    border: "#374151",
    accent: "#10B981",
    statusBar: "light",
  },
};

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState("light"); // "light" | "dark" | "custom"
  const [customImageUri, setCustomImageUriState] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.mode) setModeState(parsed.mode);
          if (parsed.customImageUri) setCustomImageUriState(parsed.customImageUri);
        }
      } catch (e) {}
    })();
  }, []);

  const persist = async (next) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {}
  };

  const setMode = (m) => {
    setModeState(m);
    persist({ mode: m, customImageUri });
  };

  const setCustomImageUri = (uri) => {
    setCustomImageUriState(uri);
    setModeState("custom");
    persist({ mode: "custom", customImageUri: uri });
  };

  // No modo "custom", a paleta base usada é a "dark" (texto claro),
  // já que a imagem de fundo costuma ser escura o suficiente para contraste.
  const colors = mode === "dark" || mode === "custom" ? PALETTES.dark : PALETTES.light;

  return (
    <ThemeContext.Provider
      value={{ mode, setMode, customImageUri, setCustomImageUri, colors }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}