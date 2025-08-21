import React from "react";

const BranchDetails = ({ branch, onToggleStatus }) => {
  if (!branch) return null;

  return (
    <div className="bg-white shadow rounded-2xl p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          {branch.logo ? (
            <img
              src={branch.logo}
              alt="Branch Logo"
              className="w-16 h-16 rounded-full object-cover border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              No Logo
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold">{branch.name}</h2>
            <p className="text-gray-600">{branch.location}</p>
            <p className="text-gray-500 text-sm">{branch.contact}</p>
          </div>
        </div>

        {/* Status Toggle */}
        <button
          onClick={onToggleStatus}
          className={`px-4 py-2 rounded-lg text-white font-medium ${
            branch.status === "active"
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {branch.status === "active" ? "Active" : "Inactive"}
        </button>
      </div>
    </div>
  );
};

export default BranchDetails;
