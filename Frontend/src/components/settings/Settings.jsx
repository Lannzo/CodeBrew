import React, { useState } from "react";
import { LS_KEYS, readLS, writeLS } from "../../helpers/localStorageUtils";

export default function Settings() {
  const [cfg, setCfg] = useState(
    readLS(LS_KEYS.settings, { taxRate: 0.12, discountRate: 0 })
  );

  function save() {
    const tax = Math.max(0, Math.min(1, Number(cfg.taxRate)));
    const disc = Math.max(0, Math.min(1, Number(cfg.discountRate)));
    const next = { taxRate: tax, discountRate: disc };
    setCfg(next);
    writeLS(LS_KEYS.settings, next);
    alert("Settings saved.");
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <div className="p-4 rounded-2xl border bg-white grid sm:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-gray-600">Tax Rate (0–1)</label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded-xl px-3 py-2"
            value={cfg.taxRate}
            onChange={(e) => setCfg({ ...cfg, taxRate: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Discount Rate (0–1)</label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded-xl px-3 py-2"
            value={cfg.discountRate}
            onChange={(e) => setCfg({ ...cfg, discountRate: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <button
            className="w-full rounded-xl px-4 py-2 bg-gray-900 text-black hover:bg-gray-700"
            onClick={save}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
