export const CATEGORIES = [
  { id: "alimentacao", label: "Alimentação", icon: "🍽️", color: "#F59E0B" },
  { id: "transporte", label: "Transporte", icon: "🚗", color: "#3B82F6" },
  { id: "casa", label: "Casa", icon: "🏠", color: "#10B981" },
  { id: "lazer", label: "Lazer", icon: "🎬", color: "#8B5CF6" },
  { id: "saude", label: "Saúde", icon: "⚕️", color: "#EF4444" },
  { id: "compras", label: "Compras", icon: "🛍️", color: "#EC4899" },
  { id: "contas", label: "Contas e Serviços", icon: "🧾", color: "#6366F1" },
  { id: "outros", label: "Outros", icon: "📦", color: "#6B7280" },
];

export function getCategoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}
