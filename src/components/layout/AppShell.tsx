import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-background)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-lg)' }}>{children}</main>
      </div>
    </div>
  );
} 