// src/helpers/useSeedData.js
import { useEffect, useState } from "react";
import { LS_KEYS, readLS, writeLS } from "./localStorageUtils";

const BRANCHES = [
  { id: crypto.randomUUID(), code: "BR-MUNTI", name: "Muntinlupa" },
  { id: crypto.randomUUID(), code: "BR-BUL", name: "Bulacan" },
  { id: crypto.randomUUID(), code: "BR-QC", name: "QC" },
];

const INVENTORY_IMAGES = [
  "banana-bread.png",
  "cappucino.png",
  "cheese-roll.png",
  "choco-croissant.png",
  "cinnamon-roll.png",
  "cold-brew.png",
  "cold-hazelnut-latte.png",
  "cold-spanish-latte.png",
  "cold-vanilla-latte.png",
  "cookies.png",
  "croissant.png",
  "double-chocolate-cookie.png",
  "espresso.png",
  "hot-americano.png",
  "hot-caramel-macchiato.png",
  "hot-flat-white.png",
  "hot-hazelnut-latte.png",
  "hot-latte.png",
  "hot-mocha.png",
  "hot-spanish-latte.png",
  "hot-vanilla-latte.png",
  "hot-white-mocha.png",
  "iced-americano.png",
  "iced-white-mocha.png",
  "oatmeal-raisin-cookie.png",
  "peanut-butter-cookie.png",
  "spanish-bread.png",
  "white-chocolate-mac-cookie.png",
];

const PRODUCT_DESCRIPTIONS = {
  "CF-006": "Strong and concentrated coffee shot, base for many drinks.",
  "CF-007": "Espresso diluted with hot water for a lighter flavor.",
  "CF-008": "Espresso with steamed milk topped with caramel drizzle.",
  "CF-009": "Espresso with velvety microfoam milk, stronger than a latte.",
  "CF-010": "Latte flavored with hazelnut syrup for a nutty-sweet taste.",
  "CF-011": "Smooth blend of espresso and steamed milk with light foam.",
  "CF-012": "Chocolate-flavored latte with whipped cream topping.",
  "CF-013": "Hot sweetened latte with condensed milk for a rich, caramelized flavor.",
  "CF-014": "Latte with vanilla syrup for a creamy, aromatic flavor.",
  "CF-015": "Espresso with white chocolate sauce, milk, and ice.",
  "CF-002": "Coffee steeped in cold water for 12+ hours, smooth and less acidic.",
  "CF-003": "Latte flavored with hazelnut syrup for a nutty-sweet taste.",
  "CF-004": "Iced sweetened latte with condensed milk for a rich, caramelized flavor.",
  "CF-005": "Latte with vanilla syrup, cold and refreshing.",
  "CF-016": "Espresso with cold water and ice, refreshing and bold.",
  "CF-017": "Chocolate-flavored iced latte topped with whipped cream.",
  "BR-001": "Soft and moist banana bread.",
  "BR-002": "Cheesy and delicious cheese roll.",
  "BR-003": "Choco croissant, crispy and sweet.",
  "BR-004": "Cinnamon roll with sugar glaze.",
  "BR-005": "Cookies, freshly baked and crunchy.",
  "BR-006": "Classic buttery croissant.",
  "BR-007": "Double chocolate cookie, rich and sweet.",
  "BR-008": "Oatmeal raisin cookie, chewy and wholesome.",
  "BR-009": "Peanut butter cookie, nutty and soft.",
  "BR-010": "Soft Spanish bread with sugar topping.",
  "BR-011": "White chocolate macadamia cookie, sweet and crunchy.",
};

const normalizeImagePath = (img) => {
  if (!img) return "/placeholder.png";
  if (img.startsWith("http")) return img;
  const cleaned = String(img)
    .replace(/^\/*assets\//i, "")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
  return `/${cleaned || "placeholder.png"}`;
};

export function useSeedData() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // --- Seed branches ---
    let branches = readLS(LS_KEYS.branches, []);
    if (!Array.isArray(branches) || branches.length === 0) {
      writeLS(LS_KEYS.branches, BRANCHES);
      branches = BRANCHES;
    }

    // --- Seed inventory ---
    let inv = readLS(LS_KEYS.inventory, []);
    const baseInventory = [
      { sku: "BR-001", name: "Banana Bread", price: 110, stock: 30, category: "Bread" },
      { sku: "CF-001", name: "Cappuccino", price: 100, stock: 30, category: "Coffee" },
      { sku: "BR-002", name: "Cheese Roll", price: 70, stock: 30, category: "Bread" },
      { sku: "BR-003", name: "Choco Croissant", price: 120, stock: 30, category: "Dessert" },
      { sku: "BR-004", name: "Cinnamon Roll", price: 110, stock: 30, category: "Dessert" },
      { sku: "CF-002", name: "Cold Brew", price: 90, stock: 30, category: "Coffee" },
      { sku: "CF-003", name: "Cold Hazelnut Latte", price: 100, stock: 30, category: "Coffee" },
      { sku: "CF-004", name: "Cold Spanish Latte", price: 110, stock: 30, category: "Coffee" },
      { sku: "CF-005", name: "Cold Vanilla Latte", price: 105, stock: 30, category: "Coffee" },
      { sku: "BR-005", name: "Cookies", price: 60, stock: 30, category: "Dessert" },
      { sku: "BR-006", name: "Croissant", price: 90, stock: 30, category: "Bread" },
      { sku: "BR-007", name: "Double Chocolate Cookie", price: 70, stock: 30, category: "Dessert" },
      { sku: "CF-006", name: "Espresso", price: 100, stock: 30, category: "Coffee" },
      { sku: "CF-007", name: "Hot Americano", price: 70, stock: 30, category: "Coffee" },
      { sku: "CF-008", name: "Hot Caramel Macchiato", price: 120, stock: 30, category: "Coffee" },
      { sku: "CF-009", name: "Hot Flat White", price: 100, stock: 30, category: "Coffee" },
      { sku: "CF-010", name: "Hot Hazelnut Latte", price: 110, stock: 30, category: "Coffee" },
      { sku: "CF-011", name: "Hot Latte", price: 80, stock: 30, category: "Coffee" },
      { sku: "CF-012", name: "Hot Mocha", price: 120, stock: 30, category: "Coffee" },
      { sku: "CF-013", name: "Hot Spanish Latte", price: 110, stock: 30, category: "Coffee" },
      { sku: "CF-014", name: "Hot Vanilla Latte", price: 105, stock: 30, category: "Coffee" },
      { sku: "CF-015", name: "Hot White Mocha", price: 125, stock: 30, category: "Coffee" },
      { sku: "CF-016", name: "Iced Americano", price: 70, stock: 30, category: "Coffee" },
      { sku: "CF-017", name: "Iced White Mocha", price: 120, stock: 30, category: "Coffee" },
      { sku: "BR-008", name: "Oatmeal Raisin Cookie", price: 70, stock: 30, category: "Dessert" },
      { sku: "BR-009", name: "Peanut Butter Cookie", price: 70, stock: 30, category: "Dessert" },
      { sku: "BR-010", name: "Spanish Bread", price: 90, stock: 30, category: "Bread" },
      { sku: "BR-011", name: "White Chocolate Mac Cookie", price: 120, stock: 30, category: "Dessert" },
    ];

    let seedInventory = [];
    branches.forEach((b) => {
      baseInventory.forEach((item, idx) => {
        const exists = inv.find((i) => i.sku === item.sku && i.branchCode === b.code);
        if (!exists) {
          seedInventory.push({
            id: crypto.randomUUID(),
            branchCode: b.code,
            ...item,
            image: normalizeImagePath(INVENTORY_IMAGES[idx] || "placeholder.png"),
            description: PRODUCT_DESCRIPTIONS[item.sku] || "No description available",
          });
        }
      });
    });

    if (seedInventory.length > 0) {
      inv = [...inv, ...seedInventory];
      writeLS(LS_KEYS.inventory, inv);
    } else {
      // Normalize image paths if already seeded
      const normalized = inv.map((p) => ({
        ...p,
        image: normalizeImagePath(p.image),
      }));
      if (JSON.stringify(normalized) !== JSON.stringify(inv)) {
        writeLS(LS_KEYS.inventory, normalized);
      }
    }

    // --- Seed assets ---
    let assets = readLS(LS_KEYS.assets, []);
    const baseAssets = [
      { tag: "AST-ESP-01", name: "Espresso Machine", status: "OK" },
      { tag: "AST-GR-02", name: "Grinder", status: "OK" },
    ];
    let seedAssets = [];
    branches.forEach((b) => {
      baseAssets.forEach((a) => {
        const exists = assets.find((x) => x.tag === a.tag && x.branchCode === b.code);
        if (!exists) seedAssets.push({ id: crypto.randomUUID(), branchCode: b.code, ...a });
      });
    });
    if (seedAssets.length > 0) writeLS(LS_KEYS.assets, [...assets, ...seedAssets]);

    // --- Seed settings ---
    let settings = readLS(LS_KEYS.settings, null);
    const DEFAULT_SETTINGS = {
      taxRate: 0.12,
      discountRate: 0,
      categories: ["Coffee", "Bread", "Dessert"],
      statuses: ["OK", "Maintenance", "Broken"],
      locations: ["Warehouse", "Office", "Front"],
    };
    if (!settings) writeLS(LS_KEYS.settings, DEFAULT_SETTINGS);
    else {
      const merged = { ...DEFAULT_SETTINGS, ...settings };
      if (JSON.stringify(merged) !== JSON.stringify(settings)) {
        writeLS(LS_KEYS.settings, merged);
      }
    }

    // --- Seed sales ---
    let sales = readLS(LS_KEYS.sales, null);
    if (!Array.isArray(sales)) writeLS(LS_KEYS.sales, []);

    setReady(true); // ✅ finished seeding
  }, []);

  return ready;
}
