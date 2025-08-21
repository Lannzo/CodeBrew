import React, { useEffect, useMemo, useState } from "react";
import { LS_KEYS, readLS, writeLS } from "../../helpers/localStorageUtils";

export default function Assets({ branch }) {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [newAsset, setNewAsset] = useState({
    tag: "",
    name: "",
    status: "OK",
    location: "Warehouse",
  });

  const STATUS_OPTIONS = ["OK", "Maintenance", "Broken"];
  const LOCATIONS = ["Warehouse", "Office"];

  // Fallback ID generator (crypto.randomUUID can be missing on older browsers)
  const genId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Load / refresh assets whenever branch changes
  useEffect(() => {
    if (!branch?.code) {
      setAssets([]);
      return;
    }
    const stored = readLS(LS_KEYS.assets, []);
    // Normalize missing fields for safety
    const normalized = stored.map((a) => ({
      ...a,
      status: STATUS_OPTIONS.includes(a.status) ? a.status : "OK",
      location: a.location || "Warehouse",
    }));
    setAssets(normalized.filter((a) => a.branchCode === branch.code));
  }, [branch]);

  // Persist a full list and then reflect branch-only slice in state
  const persistAndRefresh = (updatedAll) => {
    writeLS(LS_KEYS.assets, updatedAll);
    setAssets(updatedAll.filter((a) => a.branchCode === branch.code));
  };

  // Update status
  const handleStatusChange = (id, value) => {
    const all = readLS(LS_KEYS.assets, []);
    const updated = all.map((a) => (a.id === id ? { ...a, status: value } : a));
    persistAndRefresh(updated);
  };

  // Update location
  const handleLocationChange = (id, value) => {
    const all = readLS(LS_KEYS.assets, []);
    const updated = all.map((a) =>
      a.id === id ? { ...a, location: value } : a
    );
    persistAndRefresh(updated);
  };

  // Add new asset (with simple validation + duplicate tag guard per branch)
  const handleAddAsset = () => {
    if (!branch?.code) return;

    const name = (newAsset.name || "").trim();
    const tag = (newAsset.tag || "").trim().toUpperCase();
    const status = STATUS_OPTIONS.includes(newAsset.status)
      ? newAsset.status
      : "OK";
    const location = LOCATIONS.includes(newAsset.location)
      ? newAsset.location
      : "Warehouse";

    if (!name || !tag) return;

    const all = readLS(LS_KEYS.assets, []);
    const dup = all.some(
      (a) => a.branchCode === branch.code && String(a.tag).toUpperCase() === tag
    );
    if (dup) {
      alert("Tag already exists in this branch. Please use a unique tag.");
      return;
    }

    const assetWithBranch = {
      id: genId(),
      branchCode: branch.code,
      tag,
      name,
      status,
      location,
    };

    const updated = [...all, assetWithBranch];
    persistAndRefresh(updated);

    setNewAsset({ tag: "", name: "", status: "OK", location: "Warehouse" });
  };

  // Enter-to-add helper on the add row
  const handleAddRowKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddAsset();
    }
  };

  // Search filter
  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return assets;
    return assets.filter((a) => {
      const name = (a.name || "").toLowerCase();
      const tag = (a.tag || "").toLowerCase();
      const status = (a.status || "").toLowerCase();
      const location = (a.location || "").toLowerCase();
      return (
        name.includes(query) ||
        tag.includes(query) ||
        status.includes(query) ||
        location.includes(query)
      );
    });
  }, [assets, search]);

  // Sorting
  const sortedAssets = useMemo(() => {
    const copy = [...filteredAssets];
    copy.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredAssets, sortKey, sortOrder]);

  // Remove asset
    const handleRemoveAsset = (id) => {
      if (!window.confirm("Are you sure you want to delete this asset?")) return;
      const all = readLS(LS_KEYS.assets, []);
      const updated = all.filter((a) => a.id !== id);
      persistAndRefresh(updated);
    };


  const handleSort = (key) => {
    if (sortKey === key) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Status color mapping (kept your look)
  const statusColor = (status) => {
    switch (status) {
      case "OK":
        return "bg-green-200 text-green-800";
      case "Maintenance":
        return "bg-yellow-200 text-yellow-800";
      case "Broken":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  // Tiny summary (computed here, no design overhaul)
  const summary = useMemo(() => {
    const total = assets.length;
    const byStatus = assets.reduce(
      (acc, a) => {
        const k = a.status || "OK";
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      },
      { OK: 0, Maintenance: 0, Broken: 0 }
    );
    return { total, ...byStatus };
  }, [assets]);

  return (
    <div className="p-6 bg-amber-100 hover:shadow-lg">
      <div className="flex justify-between mb-2 items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          <span className="text-amber-950">Assets - {branch?.name}</span>
        </h2>
      </div>

      {/* Subtle summary line (keeps your style) */}
      <div className="mb-4 text-sm text-gray-600">
        Total: <b>{summary.total}</b> • OK: <b>{summary.OK}</b> • Maintenance:{" "}
        <b>{summary.Maintenance}</b> • Broken: <b>{summary.Broken}</b>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, tag, status, location..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-6 p-3 border border-gray-300 bg-white rounded-2xl focus:ring-2 focus:ring-green-400 outline-none"
      />

      <div className="bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              {["tag", "name", "status", "location"].map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 cursor-pointer select-none"
                  onClick={() => handleSort(key)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  {sortKey === key ? (sortOrder === "asc" ? " ↑" : " ↓") : ""}
                </th>
              ))}
              <th className="px-4 py-3">Actions</th>
            </tr>

            {/* Add Asset Row */}
            <tr className="bg-gray-50">
              <td className="px-4 py-2">
                <input
                  type="text"
                  placeholder="Tag"
                  value={newAsset.tag}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, tag: e.target.value })
                  }
                  onKeyDown={handleAddRowKey}
                  className="p-1 border rounded-lg w-full outline-none"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newAsset.name}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, name: e.target.value })
                  }
                  onKeyDown={handleAddRowKey}
                  className="p-1 border rounded-lg w-full outline-none"
                />
              </td>
              <td className="px-4 py-2">
                <select
                  value={newAsset.status}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, status: e.target.value })
                  }
                  onKeyDown={handleAddRowKey}
                  className="p-1 border rounded-lg w-full outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-2">
                <select
                  value={newAsset.location}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, location: e.target.value })
                  }
                  onKeyDown={handleAddRowKey}
                  className="p-1 border rounded-lg w-full outline-none"
                >
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-2 text-center">
                <button
                  onClick={handleAddAsset}
                  className="px-3 py-1 bg-green-500 text-green-600 rounded-lg hover:bg-green-600 transition"
                >
                  Add
                </button>
              </td>
            </tr>
          </thead>

          <tbody>
            {sortedAssets.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50 transition rounded-lg">
                <td className="px-4 py-3 border-b">{a.tag}</td>
                <td className="px-4 py-3 border-b">{a.name}</td>

                {/* Editable status with persistence */}
                <td className="px-4 py-3 border-b">
                  <select
                    value={a.status || "OK"}
                    onChange={(e) => handleStatusChange(a.id, e.target.value)}
                    className={`p-1 border rounded-lg w-full outline-none ${statusColor(
                      a.status || "OK"
                    )}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-3 border-b">
                  <select
                    value={a.location || "Warehouse"}
                    onChange={(e) => handleLocationChange(a.id, e.target.value)}
                    className="p-1 border rounded-lg w-full outline-none"
                  >
                    {LOCATIONS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-3 border-b text-center">
                  <button
                    onClick={() => handleRemoveAsset(a.id)}
                    className="px-3 py-1 text-red-600 rounded-lg hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                </td>

              </tr>
            ))}

            {sortedAssets.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-6">
                  {search ? "No assets match your search." : "No assets found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
