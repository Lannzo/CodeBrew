// src/components/reports/Reports.jsx
import React, { useEffect, useState } from "react";
import { LS_KEYS, readLS } from "../../helpers/localStorageUtils";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement);

export default function Reports({ branch }) {
  const [selectedBranch, setSelectedBranch] = useState(branch);
  const LOW_STOCK_THRESHOLD = 10;

  useEffect(() => setSelectedBranch(branch), [branch]);

  // Load all data
  const allSales = readLS(LS_KEYS.sales, []);
  const allInventory = readLS(LS_KEYS.inventory, []);
  const allAssets = readLS(LS_KEYS.assets, []);

  const sales = selectedBranch
    ? allSales.filter((s) => s.branchCode === selectedBranch.code)
    : allSales;

  const inventory = selectedBranch
    ? allInventory.filter((i) => i.branchCode === selectedBranch.code)
    : allInventory;

  const assets = selectedBranch
    ? allAssets.filter((a) => a.branchCode === selectedBranch.code)
    : allAssets;

  // Sales by product
  const salesByProduct = {};
  sales.forEach((s) => {
    salesByProduct[s.name] = (salesByProduct[s.name] || 0) + s.qty;
  });
  const salesBarData = {
    labels: Object.keys(salesByProduct),
    datasets: [
      {
        label: "Units Sold",
        data: Object.values(salesByProduct),
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
    ],
  };

  // Inventory report
  const lowStockItems = inventory.filter((i) => Number(i.stock) <= LOW_STOCK_THRESHOLD);
  const inventoryBarData = {
    labels: inventory.map((i) => i.name),
    datasets: [
      {
        label: "Stock Level",
        data: inventory.map((i) => Number(i.stock)),
        backgroundColor: inventory.map((i) =>
          Number(i.stock) <= LOW_STOCK_THRESHOLD ? "rgba(255,99,132,0.7)" : "rgba(75,192,192,0.7)"
        ),
      },
    ],
  };

  // Asset report
  const conditionCount = {};
  assets.forEach((a) => {
    const cond = a.status || "OK";
    conditionCount[cond] = (conditionCount[cond] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-amber-100 p-6 space-y-10">
      {selectedBranch ? (
        <>
          <h2 className="text-3xl font-bold text-amber-950 mb-6">
            Reports - {selectedBranch.name}
          </h2>

          {/* Sales */}
          <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4 overflow-x-auto">
            <h3 className="text-xl font-semibold text-gray-700">Daily Sales Report</h3>
            {sales.length ? (
              <>
                <Bar data={salesBarData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} />
                <div className="overflow-x-auto">
                  <table className="w-full mt-4 border-collapse border border-gray-200 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-200 p-2">Product</th>
                        <th className="border border-gray-200 p-2">Quantity</th>
                        <th className="border border-gray-200 p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((s, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="border border-gray-200 p-2">{s.name}</td>
                          <td className="border border-gray-200 p-2">{s.qty}</td>
                          <td className="border border-gray-200 p-2">{s.date ? new Date(s.date).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : <p className="text-gray-500">No sales records available.</p>}
          </div>

          {/* Inventory */}
          <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4 overflow-x-auto">
            <h3 className="text-xl font-semibold text-gray-700">Inventory Report</h3>
            {inventory.length ? (
              <>
                <Bar data={inventoryBarData} options={{ responsive: true }} />
                <p className="mt-2 text-gray-600 text-sm">Low stock items: {lowStockItems.length}</p>
                <div className="overflow-x-auto">
                  <table className="w-full mt-4 border-collapse border border-gray-200 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-200 p-2">Item</th>
                        <th className="border border-gray-200 p-2">Stock</th>
                        <th className="border border-gray-200 p-2">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((i, idx) => (
                        <tr key={idx} className={`hover:bg-gray-50 ${Number(i.stock) <= LOW_STOCK_THRESHOLD ? "bg-red-100 hover:bg-red-200" : ""}`}>
                          <td className="border border-gray-200 p-2">{i.name}</td>
                          <td className="border border-gray-200 p-2 font-semibold">{Number(i.stock)}</td>
                          <td className="border border-gray-200 p-2">{i.category || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : <p className="text-gray-500">No inventory records available.</p>}
          </div>

          {/* Assets */}
<div className="bg-white p-6 rounded-2xl shadow-lg space-y-4 overflow-x-auto">
  <h3 className="text-xl font-semibold text-gray-700">Asset Report</h3>
  {assets.length ? (
    <>
      <Doughnut
        data={{
          labels: Object.keys(
            assets.reduce((acc, a) => {
              acc[a.status || "OK"] = (acc[a.status || "OK"] || 0) + 1;
              return acc;
            }, {})
          ),
          datasets: [
            {
              data: Object.values(
                assets.reduce((acc, a) => {
                  acc[a.status || "OK"] = (acc[a.status || "OK"] || 0) + 1;
                  return acc;
                }, {})
              ),
              backgroundColor: Object.keys(
                assets.reduce((acc, a) => {
                  acc[a.status || "OK"] = (acc[a.status || "OK"] || 0) + 1;
                  return acc;
                }, {})
              ).map((status) =>
                status === "OK"
                  ? "#4CAF50" // green
                  : status === "Maintenance"
                  ? "#FFC107" // yellow
                  : status === "Broken"
                  ? "#F44336" // red
                  : "#90A4AE" // gray default
              ),
            },
          ],
        }}
        options={{ responsive: true }}
      />

      <div className="overflow-x-auto">
        <table className="w-full mt-4 border-collapse border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-200 p-2">Asset</th>
              <th className="border border-gray-200 p-2">Status</th>
              <th className="border border-gray-200 p-2">Location</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-gray-200 p-2">{a.name}</td>
                <td className="border border-gray-200 p-2">
                  <span
                    className={
                      a.status === "OK"
                        ? "bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs"
                        : a.status === "Maintenance"
                        ? "bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs"
                        : a.status === "Broken"
                        ? "bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs"
                        : "bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs"
                    }
                  >
                    {a.status}
                  </span>
                </td>
                <td className="border border-gray-200 p-2">
                  {a.location || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <p className="text-gray-500">No asset records available.</p>
  )}
</div>

        </>
      ) : (
        <p className="text-gray-600 text-lg">Please select a branch to view reports.</p>
      )}
    </div>
  );
}
