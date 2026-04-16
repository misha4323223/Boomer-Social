import { Product } from "./types";

export interface ProductGroup {
  primary: Product;
  variants: Product[];
}

const COLOR_HEX: Record<string, string> = {
  белый: "#ffffff",
  белая: "#ffffff",
  белое: "#ffffff",
  черный: "#1a1a1a",
  чёрный: "#1a1a1a",
  черная: "#1a1a1a",
  чёрная: "#1a1a1a",
  красный: "#ef4444",
  красная: "#ef4444",
  синий: "#3b82f6",
  синяя: "#3b82f6",
  зеленый: "#22c55e",
  зелёный: "#22c55e",
  зеленая: "#22c55e",
  зелёная: "#22c55e",
  желтый: "#eab308",
  желтая: "#eab308",
  бордовый: "#9f1239",
  бордовая: "#9f1239",
  бордовая: "#9f1239",
  розовый: "#ec4899",
  розовая: "#ec4899",
  серый: "#9ca3af",
  серая: "#9ca3af",
  бежевый: "#d4b896",
  бежевая: "#d4b896",
  голубой: "#38bdf8",
  голубая: "#38bdf8",
  оранжевый: "#f97316",
  оранжевая: "#f97316",
  фиолетовый: "#a855f7",
  фиолетовая: "#a855f7",
  хаки: "#78716c",
  бирюза: "#14b8a6",
  бирюзовый: "#14b8a6",
  салатовый: "#84cc16",
  салатовая: "#84cc16",
  "вери пери": "#6f67c6",
};

export function colorToHex(colorName: string | null | undefined): string {
  if (!colorName) return "#888888";
  return COLOR_HEX[colorName.toLowerCase().trim()] ?? "#888888";
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getBaseKey(product: Product): string {
  let name = product.name;
  if (product.color) {
    const re = new RegExp(`\\s*${escapeRegex(product.color)}\\s*`, "i");
    name = name.replace(re, " ").replace(/\s+/g, " ").trim();
  }
  return name.toLowerCase().trim();
}

export function groupProducts(products: Product[]): ProductGroup[] {
  const groupMap = new Map<string, ProductGroup>();
  const keyOrder: string[] = [];

  for (const product of products) {
    const key = getBaseKey(product);
    if (!groupMap.has(key)) {
      keyOrder.push(key);
      groupMap.set(key, { primary: product, variants: [] });
    }
    groupMap.get(key)!.variants.push(product);
  }

  return keyOrder.map((key) => groupMap.get(key)!);
}
