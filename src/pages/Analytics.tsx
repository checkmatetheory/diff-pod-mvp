import React from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const statCards = [
  { label: "Total Listens", value: "29.4K", color: "text-accent" },
  { label: "Avg. Engagement", value: "78%", color: "text-blue" },
  { label: "Revenue", value: "$105K", color: "text-accent" },
  { label: "Episodes", value: "57", color: "text-blue" },
];

const lineData = [
  { month: "Jan", listens: 4000 },
  { month: "Feb", listens: 6000 },
  { month: "Mar", listens: 8000 },
  { month: "Apr", listens: 12000 },
  { month: "May", listens: 15000 },
  { month: "Jun", listens: 18000 },
];

const pieData = [
  { name: "Spotify", value: 45, color: "#4F8CFF" },
  { name: "Apple Podcasts", value: 30, color: "#FF7A1A" },
  { name: "Google Podcasts", value: 15, color: "#2D1C13" },
  { name: "Other", value: 10, color: "#E6F0FF" },
];

const statVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.1, duration: 0.6 } }),
};

const chartVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

export default function Analytics() {
  return (
    <div className="min-h-screen bg-primary flex flex-col font-sans">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-6 bg-primary">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-accent">PodHub</span>
        </div>
        <nav className="flex gap-8 text-cardAlt text-lg font-medium">
          <a href="#dashboard" className="hover:text-accent transition">Dashboard</a>
          <a href="#analytics" className="hover:text-accent transition">Analytics</a>
          <a href="#events" className="hover:text-accent transition">Events</a>
        </nav>
        <button className="bg-accent text-white rounded-full px-6 py-2 font-semibold shadow-card hover:opacity-90 transition">Export Data</button>
      </header>

      {/* Stat Cards */}
      <section className="px-8 py-16 bg-gradient-to-br from-primary via-primaryDark to-accentLight">
        <h2 className="text-4xl font-bold text-card mb-10 text-center">Podcast Analytics</h2>
        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="rounded-2xl bg-cardAlt p-8 shadow-card flex flex-col items-center"
              custom={i}
              variants={statVariants}
              initial="hidden"
              animate="visible"
            >
              <div className={`text-4xl font-extrabold mb-2 ${stat.color}`}>{stat.value}</div>
              <div className="text-lg text-textSecondary font-semibold">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Charts Section */}
      <section className="px-8 py-20 bg-background grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
        {/* Line Chart */}
        <motion.div
          className="bg-card rounded-3xl shadow-card p-8 flex flex-col items-center"
          variants={chartVariants}
          initial="hidden"
          animate="visible"
        >
          <h3 className="text-2xl font-bold text-primary mb-6">Monthly Listens</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={lineData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#6B6B6B" fontSize={14} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B6B6B" fontSize={14} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#FFF8F3', borderRadius: 12, border: 'none', color: '#2D1C13' }} />
              <Line type="monotone" dataKey="listens" stroke="#4F8CFF" strokeWidth={4} dot={{ r: 6, fill: '#FF7A1A', stroke: '#FFF', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          className="bg-card rounded-3xl shadow-card p-8 flex flex-col items-center"
          variants={chartVariants}
          initial="hidden"
          animate="visible"
        >
          <h3 className="text-2xl font-bold text-primary mb-6">Listener Platforms</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                stroke="#FFF8F3"
                strokeWidth={4}
              >
                {pieData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </section>
    </div>
  );
}