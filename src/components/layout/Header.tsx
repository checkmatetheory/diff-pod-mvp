import React from "react";

export function Header() {
  return (
    <header style={{ height: 64, background: 'var(--color-card)', display: 'flex', alignItems: 'center', padding: '0 var(--spacing-lg)', boxShadow: '0 1px 0 0 #ececec', borderBottom: '1px solid #ececec' }}>
      <div style={{ flex: 1, fontWeight: 700, fontSize: 20 }}>Dashboard</div>
      <button
        style={{
          padding: '10px 24px',
          borderRadius: 999,
          background: 'var(--color-blue)',
          color: 'white',
          fontWeight: 600,
          fontSize: 16,
          border: 'none',
          boxShadow: '0 2px 8px 0 rgba(79,140,255,0.08)',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        + New Episode
      </button>
    </header>
  );
} 