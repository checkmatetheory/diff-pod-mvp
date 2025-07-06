import React from "react";
import { StatCard } from "../ui/StatCard";
import { FiHeadphones, FiBarChart2, FiDollarSign } from "react-icons/fi";

export function AnalyticsCards({ stats }: { stats: { episodes: number; listens: number; revenue: number } }) {
  return (
    <div style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
      <StatCard label="Total Episodes" value={stats.episodes} icon={<FiBarChart2 />} color="var(--color-blue)" />
      <StatCard label="Total Listens" value={stats.listens} icon={<FiHeadphones />} color="var(--color-accent)" />
      <StatCard label="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<FiDollarSign />} color="var(--color-blue)" />
    </div>
  );
} 