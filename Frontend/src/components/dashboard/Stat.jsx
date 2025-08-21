import React from "react";

export default function Stat({ label, value }) {
  return (
    <div className="p-4 rounded-2xl border bg-white">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}