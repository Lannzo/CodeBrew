// src/helpers/localStorageUtils.js

export const LS_KEYS = {
  inventory: "pos_inventory_v1",
  sales: "pos_sales_v1",
  assets: "pos_assets_v1",
  settings: "pos_settings_v1",
  branches: "pos_branches_branch_v1",
  selectedBranch: "pos_selected_branch_v1",
};

export const ROLES = ["admin", "branch", "cashier"];

export const ROLE_ALLOWED_PAGES = {
  admin: ["branches", "dashboard", "inventory", "assets", "reports", "settings"],
  branch: [ "inventory", "assets", "reports"],
  cashier: [ "pos", "inventory",],
};

export function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* -------------------------
   Inventory Helpers (Branch-specific)
   ------------------------- */
export function getInventory(branchCode = null) {
  const allInventory = readLS(LS_KEYS.inventory, []);
  if (!branchCode) return allInventory;
  return allInventory.filter((i) => i.branchCode === branchCode);
}
export function updateInventoryItem(updated, branchCode = null) {
  const allInventory = readLS(LS_KEYS.inventory, []);
  const updatedInventory = allInventory.map((i) =>
    i.id === updated.id && (!branchCode || i.branchCode === branchCode)
      ? { ...i, ...updated }
      : i
  );
  writeLS(LS_KEYS.inventory, updatedInventory);
  return updated;
}

// Branch-aware save
export function saveInventory(items, branchCode = null) {
  let allInventory = readLS(LS_KEYS.inventory, []);
  if (branchCode) {
    // Remove old items for this branch
    allInventory = allInventory.filter((i) => i.branchCode !== branchCode);
    allInventory = [...allInventory, ...items];
  } else {
    allInventory = items;
  }
  writeLS(LS_KEYS.inventory, allInventory);
  return items;
}

/* -------------------------
   Sales Helpers
   ------------------------- */
export function getSales() {
  return readLS(LS_KEYS.sales, []);
}

export function saveSales(sales) {
  writeLS(LS_KEYS.sales, sales);
  return sales;
}

export function recordSale(sale) {
  // sale = { productId, qty, total, date }
  const sales = getSales();
  const newSale = { id: `sale-${Date.now()}`, date: new Date().toISOString(), ...sale };
  sales.push(newSale);
  saveSales(sales);
  return newSale;
}

/* -------------------------
   Assets Helpers
   ------------------------- */
export function getAssets() {
  return readLS(LS_KEYS.assets, []);
}

export function saveAssets(assets) {
  writeLS(LS_KEYS.assets, assets);
  return assets;
}

export function addAsset(asset) {
  const assets = getAssets();
  const newAsset = { id: `asset-${Date.now()}`, ...asset };
  assets.push(newAsset);
  saveAssets(assets);
  return newAsset;
}

export function updateAsset(updated) {
  const assets = getAssets().map((a) => (a.id === updated.id ? { ...a, ...updated } : a));
  saveAssets(assets);
  return updated;
}

export function removeAsset(id) {
  const assets = getAssets().filter((a) => a.id !== id);
  saveAssets(assets);
  return assets;
}

/* -------------------------
   Reports / Stats Helpers
   ------------------------- */
export function getReportStats() {
  const inventory = getInventory();
  const sales = getSales();
  const assets = getAssets();

  // Total Sales
  const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);

  // Top Product by sales qty
  const productCount = {};
  sales.forEach((s) => {
    productCount[s.productId] = (productCount[s.productId] || 0) + (s.qty || 0);
  });
  const topProductId = Object.keys(productCount).sort(
    (a, b) => productCount[b] - productCount[a]
  )[0];
  const topProduct =
    inventory.find((i) => i.id === topProductId)?.name || "N/A";

  // Low stock count
  const lowStock = inventory.filter((i) => i.stock !== undefined && i.stock < 5).length;

  // Asset count
  const assetCount = assets.length;

  return {
    totalSales,
    topProduct,
    lowStock,
    assetCount,
  };
}

/* -------------------------
   Branch helpers (unchanged)
   ------------------------- */

export function getBranches() {
  return readLS(LS_KEYS.branches, []);
}

export function saveBranches(branches) {
  writeLS(LS_KEYS.branches, branches);
  return branches;
}

export function addBranch(branch) {
  const branches = getBranches();
  branches.push(branch);
  saveBranches(branches);
  return branch;
}

export function updateBranch(updatedBranch) {
  let branches = getBranches();
  branches = branches.map((b) => (b.id === updatedBranch.id ? updatedBranch : b));
  saveBranches(branches);
  return updatedBranch;
}

export function removeBranch(id) {
  const branches = getBranches().filter((b) => b.id !== id);
  saveBranches(branches);
  return branches;
}

export function getSelectedBranch() {
  return readLS(LS_KEYS.selectedBranch, null);
}

export function setSelectedBranch(branch) {
  writeLS(LS_KEYS.selectedBranch, branch);
  return branch;
}

/* -------------------------
   User Management per Branch (unchanged)
   ------------------------- */

export function getUsers(branchId) {
  const branch = getBranches().find((b) => b.id === branchId);
  return branch ? branch.users || [] : [];
}

export function addUser(branchId, user) {
  const branches = getBranches();
  const idx = branches.findIndex((b) => b.id === branchId);
  if (idx === -1) return null;

  const newUser = { ...user, id: `u-${Date.now()}` };
  branches[idx].users = [...(branches[idx].users || []), newUser];
  saveBranches(branches);
  return newUser;
}

export function updateUser(branchId, updatedUser) {
  const branches = getBranches();
  const idx = branches.findIndex((b) => b.id === branchId);
  if (idx === -1) return null;

  branches[idx].users = (branches[idx].users || []).map((u) =>
    u.id === updatedUser.id ? { ...u, ...updatedUser } : u
  );

  saveBranches(branches);
  return updatedUser;
}

export function removeUser(branchId, userId) {
  const branches = getBranches();
  const idx = branches.findIndex((b) => b.id === branchId);
  if (idx === -1) return null;

  branches[idx].users = (branches[idx].users || []).filter((u) => u.id !== userId);
  saveBranches(branches);
  return true;
}

/* -------------------------
   Seed Default Branches (unchanged)
   ------------------------- */
export function seedDefaultBranches() {
  const existing = getBranches();
  if (existing.length > 0) return existing;

  const now = Date.now();
  const defaults = [
    {
      id: `branch-${now}-1`,
      code: "MAIN",
      name: "Main Branch",
      logo: "",
      location: "Quezon City",
      contact: "0917-000-0000",
      status: "active",
      users: [
        { id: `u-${now}-1`, name: "Admin User", role: "admin" },
        { id: `u-${now}-2`, name: "Branch Manager", role: "branch" },
      ],
    },
    {
      id: `branch-${now}-2`,
      code: "NORTH",
      name: "North Branch",
      logo: "",
      location: "Quezon North",
      contact: "0917-111-1111",
      status: "active",
      users: [{ id: `u-${now}-3`, name: "Cashier 1", role: "cashier" }],
    },
  ];

  saveBranches(defaults);
  return defaults;
}
