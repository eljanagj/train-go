// src/components/PageLoader.jsx
import React from "react";
import "../styles/PageLoader.css"; 

export const PageLoader = () => (
  <div className="page-loader">
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Loading…</span>
    </div>
  </div>
);
