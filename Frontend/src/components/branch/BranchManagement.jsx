// src/components/branch/BranchManagement.jsx
import React, { useEffect, useState } from "react";
import {
  getBranches,
  saveBranches,
  addUser,
  updateUser,
  removeUser,
  ROLES,
} from "../../helpers/localStorageUtils";
import Settings from "../settings/Settings"; // ✅ import Settings

export default function BranchManagement({ selectedBranch, onSelectBranch, role }) {
  const [branches, setBranches] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [showSelector, setShowSelector] = useState(false);

  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    id: "",
    username: "",
    name: "",
    role: ROLES.includes("cashier") ? "cashier" : ROLES[0],
    email: "",
    password: "",
  });
  const [isEditingUser, setIsEditingUser] = useState(false);

  // Load branches on mount
  useEffect(() => {
    const brs = getBranches() || [];
    setBranches(brs);
    if (selectedBranch) {
      setSelectedCode(selectedBranch.code);
      setUsers(selectedBranch.users || []);
    } else {
      setSelectedCode("");
      setUsers([]);
    }
  }, [selectedBranch]);

  // Sync users when selected branch changes
  useEffect(() => {
    if (!selectedBranch) {
      setUsers([]);
      setUserForm({
        id: "",
        username: "",
        name: "",
        role: ROLES.includes("cashier") ? "cashier" : ROLES[0],
        email: "",
        password: "",
      });
      setIsEditingUser(false);
      return;
    }
    setUsers(selectedBranch.users || []);
    setUserForm({
      id: "",
      username: "",
      name: "",
      role: ROLES.includes("cashier") ? "cashier" : ROLES[0],
      email: "",
      password: "",
    });
    setIsEditingUser(false);
  }, [selectedBranch]);

  const handleSelect = (code) => {
    const branch = branches.find((b) => b.code === code);
    if (!branch) return;
    setSelectedCode(code);
    onSelectBranch(branch);
    setShowSelector(false);
  };

  const handleSaveUser = () => {
    if (!selectedBranch) return alert("Select a branch first.");
    const { username, name, role, password } = userForm;
    if (!username.trim()) return alert("Enter a username.");
    if (!name.trim()) return alert("Enter a name.");
    if (!role) return alert("Select a role.");
    if (!password.trim()) return alert("Enter a password.");

    if (isEditingUser) {
      updateUser(selectedBranch.id, userForm);
    } else {
      addUser(selectedBranch.id, userForm);
    }

    const freshBranches = getBranches();
    const updatedBranch = freshBranches.find((b) => b.code === selectedBranch.code);
    onSelectBranch(updatedBranch);

    setUserForm({
      id: "",
      username: "",
      name: "",
      role: ROLES.includes("cashier") ? "cashier" : ROLES[0],
      email: "",
      password: "",
    });
    setIsEditingUser(false);
  };

  const handleEditUser = (u) => {
    setIsEditingUser(true);
    setUserForm(u);
  };

  const handleRemoveUser = (id) => {
    if (!selectedBranch) return;
    if (!confirm("Remove user?")) return;
    removeUser(selectedBranch.id, id);
    const freshBranches = getBranches();
    onSelectBranch(freshBranches.find((b) => b.code === selectedBranch.code));
  };

  const handleCreateBranch = () => {
    const name = prompt("Branch name:");
    if (!name) return;
    const code = prompt("Branch code (unique):", name.toUpperCase().slice(0, 6));
    if (!code) return;
    const newBranch = { id: `branch-${Date.now()}`, code, name, status: "active", users: [] };
    const newBranches = [newBranch, ...branches];
    saveBranches(newBranches);
    setBranches(newBranches);
    setSelectedCode(code);
    onSelectBranch(newBranch);
    setShowSelector(false);
  };

  const handleToggleStatus = () => {
    if (!selectedBranch) return;
    const updatedBranches = branches.map((b) =>
      b.id === selectedBranch.id
        ? { ...b, status: b.status === "active" ? "inactive" : "active" }
        : b
    );
    saveBranches(updatedBranches);
    setBranches(updatedBranches);
    const updatedBranch = updatedBranches.find((b) => b.id === selectedBranch.id);
    onSelectBranch(updatedBranch);
  };

  return (
    <div className="p-6 bg-amber-100  shadow-md max-w-4xl mx-auto mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-amber-950">Branch Management</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200"
          >
            {showSelector ? "Hide Selector" : "Change Branch"}
          </button>
          <button
            onClick={handleCreateBranch}
            className="px-3 py-1 rounded-lg bg-green-100 hover:bg-green-200"
          >
            + Create Branch
          </button>
        </div>
      </div>

      {/* Branch Selector */}
      {showSelector && (
        <div className="mb-6">
          <select
            value={selectedCode}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full p-3 border bg-white rounded-lg focus:ring-2 focus:ring-green-400"
          >
            <option value="">-- Select a Branch --</option>
            {branches.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {!selectedBranch && (
        <div className="p-6 bg-yellow-50 rounded-lg text-gray-700">
          No branch selected. Use "Create Branch" or "Change / Select Branch".
        </div>
      )}

      {selectedBranch && (
        <>
          {/* Branch Details */}
          <div className="bg-gray-50 p-5 rounded-xl shadow-sm mb-6 flex justify-between items-center">
            <div>
              <div className="text-lg font-bold">{selectedBranch.name}</div>
              <div className="text-sm">{selectedBranch.code}</div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedBranch.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {selectedBranch.status}
              </span>

              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedBranch.status === "active"}
                  onChange={handleToggleStatus}
                />
                <div
                  className={`w-11 h-6 rounded-full transition relative ${
                    selectedBranch.status === "active" ? "bg-green-500" : "bg-gray-400"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition ${
                      selectedBranch.status === "active" ? "translate-x-5" : ""
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Users */}
          <div className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <h3 className="text-lg font-semibold mb-4">Users ({users.length})</h3>
            <table className="w-full text-left mb-4">
              <thead className="bg-gray-100 text-sm text-gray-600 border-r rounded-sm">
                <tr>
                  <th className="p-2">Username</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Email</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td className="p-2">{u.username}</td>
                      <td className="p-2">{u.name}</td>
                      <td className="p-2">{u.role}</td>
                      <td className="p-2">{u.email || "—"}</td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => handleEditUser(u)}
                          className="px-2 py-1 mr-2 bg-amber-100 rounded-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveUser(u.id)}
                          className="px-2 py-1 bg-red-500 text-red-600 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-2 text-center text-gray-500">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* User Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <input
                type="text"
                placeholder="Username"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Full name"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="password"
                placeholder="Password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              >
                {ROLES.filter((r) => r !== "admin").map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <div className="md:col-span-4 flex gap-2 justify-end mt-2">
                {isEditingUser ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditingUser(false);
                        setUserForm({
                          id: "",
                          username: "",
                          name: "",
                          role: ROLES.includes("cashier") ? "cashier" : ROLES[0],
                          email: "",
                          password: "",
                        });
                      }}
                      className="px-4 py-2 bg-gray-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveUser}
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleSaveUser}
                    className="px-4 py-2 bg-green-600 text-green-600 rounded"
                  >
                    + Add User
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white p-5 rounded-xl shadow-sm mt-6">
            <h3 className="text-lg font-semibold mb-4">Branch Settings</h3>
            <Settings branch={selectedBranch} role={role} />
          </div>
        </>
      )}
    </div>
  );
}
