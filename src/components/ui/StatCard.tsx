import React from "react";

export function StatCard({ label, value, icon, color = "var(--color-accent)" }: { label: string; value: string | number; icon: React.ReactNode; color?: string }) {
  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 20, boxShadow: '0 4px 24px 0 rgba(45,28,19,0.08)', padding: 24, display: 'flex', alignItems: 'center', gap: 16, minWidth: 200 }}>
      <div style={{ fontSize: 32, color }}>{icon}</div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
        <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{label}</div>
      </div>
    </div>
  );
} 