import React from "react";
import { FiHome, FiMic, FiUsers, FiBarChart2, FiSettings } from "react-icons/fi";

const navItems = [
  { label: "Dashboard", icon: <FiHome />, href: "/dashboard" },
  { label: "Episodes", icon: <FiMic />, href: "/dashboard/episodes" },
  { label: "Hosts", icon: <FiUsers />, href: "/dashboard/hosts" },
  { label: "Analytics", icon: <FiBarChart2 />, href: "/dashboard/analytics" },
  { label: "Settings", icon: <FiSettings />, href: "/dashboard/settings" },
];

export function Sidebar() {
  return (
    <aside style={{ width: 256, background: 'var(--color-primary)', color: 'white', display: 'flex', flexDirection: 'column', padding: 'var(--spacing-lg) var(--spacing-md)' }}>
      <div style={{ marginBottom: 48, fontWeight: 700, fontSize: 28, letterSpacing: -1 }}>PodHub</div>
      <nav style={{ flex: 1 }}>
        {navItems.map((item, idx) => (
          <a
            key={item.label}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              borderRadius: 12,
              marginBottom: 8,
              color: 'inherit',
              textDecoration: 'none',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--color-blue-light)')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontWeight: 500 }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
} 