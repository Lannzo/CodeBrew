import React, { useEffect, useState } from "react";
import { LS_KEYS, readLS, writeLS } from "./helpers/localStorageUtils";
import { useSeedData } from "./helpers/useSeedData";
import Shell from "./components/layout/Shell";
import LoginView from "./components/layout/LoginView";
import { InventoryProvider } from "./components/inventory/InventoryContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const ready = useSeedData(); // <-- run seeding first

  const [role, setRole] = useState(() => readLS(LS_KEYS.role, null));
  const [page, setPage] = useState("dashboard");
  const [selectedBranch, setSelectedBranch] = useState(() =>
    readLS(LS_KEYS.selectedBranch, null)
  );

  useEffect(() => {
    const savedBranch = readLS(LS_KEYS.selectedBranch, null);
    if (savedBranch) setSelectedBranch(savedBranch);
  }, []);

  const handleLogin = (nextRole, branch = null) => {
    setRole(nextRole);
    writeLS(LS_KEYS.role, nextRole); // persist role

    if (nextRole === "admin") {
      setPage("branches");
      setSelectedBranch(null);
      writeLS(LS_KEYS.selectedBranch, null);
    } else if (branch) {
      setSelectedBranch(branch);
      writeLS(LS_KEYS.selectedBranch, branch);
      setPage("dashboard");
    }
  };

  const handleLogout = () => {
    setRole(null);
    setPage("dashboard");
    setSelectedBranch(null);
    writeLS(LS_KEYS.role, null);
    writeLS(LS_KEYS.selectedBranch, null);
    writeLS(LS_KEYS.lastUser, null);
  };

  const handleSelectBranch = (branch) => {
    setSelectedBranch(branch);
    writeLS(LS_KEYS.selectedBranch, branch);
  };

  // ⏳ Wait until seeding is complete
  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading data...
      </div>
    );
  }

  // 🔑 Login flow
  if (!role) {
    return (
      <>
        <LoginView onLogin={handleLogin} />
        <ToastContainer position="top-right" autoClose={2000} />
      </>
    );
  }

  // ✅ Wrap shell only AFTER seeding is ready
  return (
    <InventoryProvider>
      <Shell
        role={role}
        onLogout={handleLogout}
        page={page}
        setPage={setPage}
        selectedBranch={selectedBranch}
        onSelectBranch={handleSelectBranch}
      />
      <ToastContainer position="top-right" autoClose={2000} />
    </InventoryProvider>
  );
}
