// src/components/branch/RequireBranch.jsx
import React from "react";
import { getSelectedBranch } from "../../helpers/localStorageUtils";
import { Navigate } from "react-router-dom";

export default function RequireBranch({ children }) {
  const branch = getSelectedBranch();

  if (!branch) {
    // Redirect to branch selection page
    return <Navigate to="/branches" replace />;
  }

  return children;
}
