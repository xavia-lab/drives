// src/app/loading.tsx
import React from "react";

export default function Loading() {
  return (
    <div className="emerald-loader-container">
      <div className="emerald-loader-wrapper">
        {/* Application icon - matches the Lucide HardDrive design */}
        <svg
          xmlns="http://www.w3.org"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="emerald-gem-pulse"
        >
          <line x1="22" x2="2" y1="12" y2="12" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          <line x1="6" x2="6.01" y1="16" y2="16" />
          <line x1="10" x2="10.01" y1="16" y2="16" />
        </svg>

        <h2 className="emerald-loader-text">
          Drives<span>System</span>
        </h2>

        <div className="emerald-progress-bar">
          <div className="emerald-progress-fill"></div>
        </div>
      </div>
    </div>
  );
}
