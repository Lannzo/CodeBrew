// src/components/layout/Shell.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  ROLE_ALLOWED_PAGES,
  LS_KEYS,
  readLS,
  writeLS,
} from "../../helpers/localStorageUtils";
import Dashboard from "../dashboard/Dashboard";
import POS from "../pos/POS";
import Inventory from "../inventory/Inventory";
import Assets from "../assets/Assets";
import Reports from "../reports/Reports";
import BranchManagement from "../branch/BranchManagement";
import coffeeLogo from "/src/assets/coffee-title-logo.jpg";
import { useInventory } from "../inventory/InventoryContext"; 

export default function Shell({
  role,
  onLogout,
  page,
  setPage,
  selectedBranch,
  onSelectBranch,
}) {
  const [switchModal, setSwitchModal] = useState(false);

  // Inventory context
  const { inventory, updateItem } = useInventory();
  
  const branches = useMemo(
    () => readLS(LS_KEYS.branches, []),
    [switchModal, page]
  );

  const allowed = ROLE_ALLOWED_PAGES[role] || [];

  const baseNav = [
    ...(role === "admin"
      ? [{ id: "branches", label: "Branch Management" }]
      : []),
    { id: "dashboard", label: "Dashboard" },
    { id: "pos", label: "POS" },
    { id: "inventory", label: "Inventory" },
    { id: "assets", label: "Assets" },
    { id: "reports", label: "Reports" },
  ].filter((i) => allowed.includes(i.id));

  // Admin without branch sees only Branch Management
  const navItems =
    role === "admin" && !selectedBranch
      ? baseNav.filter((i) => i.id === "branches")
      : baseNav;

  const isBranchInactive =
    !!selectedBranch &&
    (
      (typeof selectedBranch.status === "string" &&
        selectedBranch.status.toLowerCase() !== "active") ||
      selectedBranch.active === false
    );

  // Force branch selection for admin
  useEffect(() => {
    if (role === "admin" && !selectedBranch && page !== "branches") {
      setPage("branches");
    }
  }, [role, selectedBranch, page, setPage]);

  const goto = (next) => {
    if (role === "admin" && !selectedBranch && next !== "branches") {
      alert("Please select a branch first.");
      setPage("branches");
      return;
    }

    if (isBranchInactive && next !== "branches") {
      alert("This branch is inactive. You cannot access this section.");
      return;
    }

    setPage(next);
  };

  const pickBranch = (branch) => {
    if (!branch) return;
    onSelectBranch(branch);
    writeLS(LS_KEYS.selectedBranch, branch);
    setPage("dashboard");
  };

  const clearBranch = () => {
    onSelectBranch(null);
    localStorage.removeItem(LS_KEYS.selectedBranch);
    if (role === "admin") setPage("branches");
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-gray-900">
      {/* Header */}
      <header className="shrink-0 bg-amber-950 backdrop-blur border-b">
        <div className="w-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 text-black flex items-center justify-center font-bold">
              <img src={coffeeLogo} className="rounded-xl" alt="logo" />
            </div>
            <span className="font-sans text-white font-bold">
              CODE BREW - Management System
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-amber-50 capitalize font-bold">
              Role: {role}
            </span>

            {role === "admin" && (
              <span className="px-3 py-1 text-black rounded-2xl bg-green-300 text-sm font-bold flex items-center gap-2">
                Branch: {selectedBranch ? selectedBranch.name : "—"}
                <button
                  onClick={() => setSwitchModal(true)}
                  className="ml-1 px-0.3 py-0.3 rounded bg-white border text-black hover:bg-gray-50 text-xs"
                >
                  {selectedBranch ? "Switch" : "Select"}
                </button>
                {selectedBranch && (
                  <button
                    onClick={clearBranch}
                    className="ml-1 px-2 py-0.5 rounded text-black bg-white border hover:bg-gray-50 text-xs"
                  >
                    Clear
                  </button>
                )}
              </span>
            )}

            {/* Only show branch for non-admin roles */}
            {role !== "admin" && selectedBranch && (
              <span className="px-2 py-1 rounded bg-green-100 text-sm font-bold">
                Branch: {String(selectedBranch.name) || "Unknown"}
              </span>
            )}

            <button
              className="px-3 py-1.5 rounded-lg bg-red-600 text-red-600 hover:bg-red-700"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-60 bg-amber-100 border-r p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isDisabled =
                !!selectedBranch &&
                isBranchInactive &&
                item.id !== "branches";

              return (
                <li key={item.id}>
                  <button
                    onClick={() => !isDisabled && goto(item.id)}
                    disabled={isDisabled}
                    className={`w-full text-left px-4 py-2 rounded-xl border-amber-900 transition-colors duration-200
                      ${
                        page === item.id
                          ? "bg-amber-900 text-black font-bold border-amber-900"
                          : isDisabled
                          ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                          : "bg-white hover:bg-amber-200"
                      }`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <div className="mb-4 text-gray-500 text-sm">
            {role} / {selectedBranch ? selectedBranch.name : "No Branch"} /{" "}
            {page.charAt(0).toUpperCase() + page.slice(1)}
          </div>

          {page === "branches" && role === "admin" && (
            <BranchManagement
              selectedBranch={selectedBranch}
              onSelectBranch={pickBranch}
            />
          )}

          {isBranchInactive && page !== "branches" ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
              🚫 This branch <b>{selectedBranch?.name}</b> is currently{" "}
              <b>inactive</b>. Please activate it in <b>Branch Management</b> to
              access <i>{page}</i>.
            </div>
          ) : (
            <>
              {page === "dashboard" && (
                <Dashboard role={role} branch={selectedBranch} />
              )}
              {page === "pos" && (
                <POS
                  branch={selectedBranch}
                  inventory={inventory}
                  updateItem={updateItem}
                />
              )}
              {page === "inventory" && (
                <Inventory
                  role={role}
                  branch={selectedBranch}
                  inventory={inventory}
                  updateItem={updateItem}
                />
              )}
              {page === "assets" && <Assets branch={selectedBranch} />}
              {page === "reports" && <Reports branch={selectedBranch} />}

            </>
          )}
        </main>
      </div>

      {/* Switch Branch Modal */}
      {switchModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-[28rem]">
            <h2 className="text-lg font-bold mb-4">Select Branch</h2>

            {branches.length > 0 ? (
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {branches.map((b) => (
                  <li key={b.id ?? b.code}>
                    <button
                      onClick={() => {
                        pickBranch(b);
                        setSwitchModal(false);
                      }}
                      className={`w-full px-4 py-2 rounded-lg border text-left hover:bg-amber-50 ${
                        selectedBranch?.code === b.code
                          ? "bg-amber-100 border-amber-300"
                          : "bg-white"
                      }`}
                    >
                      <div className="font-semibold">{b.name}</div>
                      <div className="text-xs text-gray-500">
                        Code: {b.code} {b.address ? `• ${b.address}` : ""}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-600">
                No branches found. Create one in Branch Management.
              </div>
            )}

            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setSwitchModal(false);
                  setPage("branches");
                }}
                className="px-3 py-1 rounded bg-amber-100 hover:bg-amber-200"
              >
                Go to Branch Management
              </button>
              <button
                onClick={() => setSwitchModal(false)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}