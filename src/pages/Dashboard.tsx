import React from "react";
import { motion } from "framer-motion";

const stats = [
  { label: "Total Episodes", value: "57", color: "text-blue" },
  { label: "Total Listens", value: "29.4K", color: "text-accent" },
  { label: "Sponsor Revenue", value: "$105K", color: "text-blue" },
  { label: "Active Hosts", value: "12", color: "text-accent" },
];

const event = {
  title: "AI in Fintech: Future Trends Panel",
  date: "2024-01-15",
  duration: "47 min",
  hosts: ["Sarah Chen", "Michael Rodriguez", "Dr. Lisa Zhang"],
  listens: 1234,
  revenue: 3400,
  image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=facearea&w=400&h=400&q=80",
};

const statVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.1, duration: 0.6 } }),
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7 } },
};

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-primary flex flex-col font-sans">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-6 bg-primary">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-accent">PodHub</span>
        </div>
        <nav className="flex gap-8 text-cardAlt text-lg font-medium">
          <a href="#" className="hover:text-accent transition">Dashboard</a>
          <a href="#analytics" className="hover:text-accent transition">Analytics</a>
          <a href="#events" className="hover:text-accent transition">Events</a>
        </nav>
        <button className="bg-accent text-white rounded-full px-6 py-2 font-semibold shadow-card hover:opacity-90 transition">New Episode</button>
      </header>

      {/* Stats Section */}
      <section className="px-8 py-16 bg-gradient-to-br from-primary via-primaryDark to-accentLight">
        <h2 className="text-4xl font-bold text-card mb-10 text-center">Your Podcast Overview</h2>
        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {stats.map((stat, i) => (
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

      {/* Event/Profile Card */}
      <section className="px-8 py-20 bg-background">
        <h2 className="text-3xl font-bold text-primary mb-10 text-center">Featured Event</h2>
        <motion.div
          className="max-w-3xl mx-auto rounded-3xl bg-card shadow-card flex flex-col md:flex-row items-center p-8 gap-8"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <img
            src={event.image}
            alt={event.title}
            className="w-40 h-40 rounded-2xl object-cover mb-6 md:mb-0"
          />
          <div className="flex-1">
            <div className="text-xl font-bold text-primary mb-2">{event.title}</div>
            <div className="text-md text-textSecondary mb-2">{event.date} • {event.duration}</div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {event.hosts.map((host) => (
                <span key={host} className="bg-blueLight text-blue rounded-full px-4 py-1 text-sm font-semibold mr-2 mb-2">{host}</span>
              ))}
            </div>
            <div className="flex gap-4 items-center mb-4">
              <span className="bg-accentLight text-accent rounded-full px-4 py-1 text-sm font-semibold">{event.listens} Listens</span>
              <span className="bg-blueLight text-blue rounded-full px-4 py-1 text-sm font-semibold">${event.revenue} Revenue</span>
            </div>
            <button className="bg-accent text-white rounded-full px-8 py-3 font-bold text-lg shadow-card hover:opacity-90 transition">View Details</button>
          </div>
        </motion.div>
      </section>
    </div>
  );
} 