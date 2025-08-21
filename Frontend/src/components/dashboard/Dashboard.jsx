import React, { useState, useEffect } from "react";
import Stat from "./Stat";
import { LS_KEYS, readLS, getInventory } from "../../helpers/localStorageUtils";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

export default function Dashboard({ role }) {
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Load saved branch from localStorage
  useEffect(() => {
    const savedBranch = readLS(LS_KEYS.selectedBranch, null);
    if (savedBranch) setSelectedBranch(savedBranch);
  }, []);

  // Use helper to get inventory for selected branch
  const rawInventory = selectedBranch ? getInventory(selectedBranch.code) : [];

  // Normalize stocks (always number)
  const inventory = rawInventory.map(i => ({
    ...i,
    stock: Number(i.stock) || 0,
  }));

  const sales = selectedBranch
    ? readLS(LS_KEYS.sales, []).filter(
        (s) => s.branchCode === selectedBranch.code
      )
    : readLS(LS_KEYS.sales, []);

  const totalStock = inventory.reduce((s, i) => s + i.stock, 0);
  const lowStockCount = inventory.filter((i) => i.stock <= 10).length;

  const today = new Date().toDateString();
  const todaySales = sales.filter(
    (s) => new Date(s.ts).toDateString() === today
  ).length;

  // Sales by product (bar chart)
  const salesByProduct = {};
  sales.forEach((s) => {
    salesByProduct[s.name] = (salesByProduct[s.name] || 0) + 1;
  });
  const barData = {
    labels: Object.keys(salesByProduct),
    datasets: [
      {
        label: "Units Sold",
        data: Object.values(salesByProduct),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  // Daily sales trend (line chart)
  const salesByDate = {};
  sales.forEach((s) => {
    const day = new Date(s.ts).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
    salesByDate[day] = (salesByDate[day] || 0) + 1;
  });
  const lineData = {
    labels: Object.keys(salesByDate),
    datasets: [
      {
        label: "Sales per Day",
        data: Object.values(salesByDate),
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.3,
      },
    ],
  };


  console.log("📦 Dashboard inventory:", inventory);
  console.log("⚠️ Low stock items:", inventory.filter(i => i.stock <= 5));

  return (
    <div className=" hover:shadow-lg bg-amber-100 p-6 space-y-8">
      {selectedBranch ? (
        <>
          <h2 className="text-3xl font-bold text-amber-950">
            Dashboard - {selectedBranch.name}{" "}
            <span className="capitalize text-gray-500">({role})</span>
          </h2>

          {/* Stat cards */}
          <div className=" grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Stat label="Total Products in Stock" value={totalStock} />
            <Stat label="Low Stock Items" value={lowStockCount} />
            <Stat label="Sales Today" value={todaySales} />
            <Stat label="Total Sales Records" value={sales.length} />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
              <Bar data={barData} />
            </div>
            <div className="p-6 rounded-2xl bg-white shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Daily Sales Trend</h3>
              <Line data={lineData} />
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-600 text-lg">
          Please select a branch to view the dashboard.
        </p>
      )}
    </div>
  );
}
