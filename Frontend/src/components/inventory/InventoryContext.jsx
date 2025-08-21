/* eslint-disable react-refresh/only-export-components */
// src/components/inventory/InventoryContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { LS_KEYS, readLS, writeLS } from "../../helpers/localStorageUtils";

const InventoryContext = createContext();

export function InventoryProvider({ children }) {
  const [inventory, setInventory] = useState([]);
  const [branches, setBranches] = useState([]);

  // Load inventory and branches from localStorage on mount
  useEffect(() => {
    setInventory(readLS(LS_KEYS.inventory, []));
    setBranches(readLS(LS_KEYS.branches, []));
  }, []);

  // Sync inventory to localStorage whenever it changes
  useEffect(() => {
    writeLS(LS_KEYS.inventory, inventory);
  }, [inventory]);

  // ---- Helpers ----

  const updateItem = useCallback((id, changes) => {
    setInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...changes } : i))
    );
  }, []);

  const updateStock = useCallback((id, delta, branchCode) => {
    setInventory((prev) =>
      prev.map((i) =>
        i.id === id && i.branchCode === branchCode
          ? { ...i, stock: Math.max(0, i.stock + delta) }
          : i
      )
    );
  }, []);

  const transferItem = useCallback(
    (itemId, fromBranchCode, toBranchCode, qty) => {
      setInventory((prev) => {
        // Decrease stock in source branch
        const updated = prev.map((i) =>
          i.id === itemId && i.branchCode === fromBranchCode
            ? { ...i, stock: Math.max(0, i.stock - qty) }
            : i
        );

        const item = prev.find(
          (i) => i.id === itemId && i.branchCode === fromBranchCode
        );
        if (!item) return updated;

        // Find item in target branch
        const existingIndex = updated.findIndex(
          (i) => i.sku === item.sku && i.branchCode === toBranchCode
        );

        if (existingIndex !== -1) {
          // Create new object to avoid mutation
          updated[existingIndex] = {
            ...updated[existingIndex],
            stock: updated[existingIndex].stock + qty,
          };
        } else {
          // Add new item in target branch
          updated.push({
            ...item,
            id: `item-${Date.now()}`,
            branchCode: toBranchCode,
            stock: qty,
          });
        }

        return updated;
      });
    },
    []
  );

  return (
    <InventoryContext.Provider
      value={{ inventory, branches, updateItem, updateStock, transferItem }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export const useInventory = () => useContext(InventoryContext);
