// src/app/loading.tsx
import React from "react";

export default function Loading() {
  return (
    <div className="emerald-loader-container">
      <div className="emerald-loader-wrapper">
        {/* SVG Gem Icon - Matches Lucide Gem design */}
        <svg
          xmlns="http://www.w3.org"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="rgba(80, 200, 120, 0.2)"
          stroke="#50C878"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="emerald-gem-pulse"
        >
          <path d="M6 3h12l4 6-10 12L2 9z" />
          <path d="M11 3 8 9l4 12 4-12-3-6" />
          <path d="M2 9h20" />
        </svg>

        <h2 className="emerald-loader-text">
          Emerald<span>System</span>
        </h2>

        <div className="emerald-progress-bar">
          <div className="emerald-progress-fill"></div>
        </div>
      </div>
    </div>
  );
}
