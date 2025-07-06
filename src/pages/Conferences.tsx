import React from "react";
import { motion } from "framer-motion";

const mediaGroups = [
  {
    id: "fintech",
    name: "FinTech Innovation Summit",
    industry: "Financial Technology",
    logo: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=facearea&w=200&h=200&q=80",
    color: "#4F8CFF",
    podcasts: [
      {
        title: "AI in Fintech: Future Trends Panel",
        host: "Sarah Chen",
        duration: "47 min",
        listens: 1234,
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=facearea&w=400&h=400&q=80",
      },
      {
        title: "Quarterly Investment Review",
        host: "Michael Rodriguez",
        duration: "32 min",
        listens: 980,
        image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=400&h=400&q=80",
      },
    ],
  },
  {
    id: "healthtech",
    name: "Healthcare Digital Transformation",
    industry: "Healthcare Technology",
    logo: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=200&h=200&q=80",
    color: "#FF7A1A",
    podcasts: [
      {
        title: "AI in Healthcare - Expert Panel Discussion",
        host: "Dr. Sarah Chen",
        duration: "42 min",
        listens: 850,
        image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=400&h=400&q=80",
      },
    ],
  },
];

const groupVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.15, duration: 0.7 } }),
};

const podcastVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};

export default function Conferences() {
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
          <a href="#conferences" className="hover:text-accent transition">Conferences</a>
        </nav>
        <button className="bg-accent text-white rounded-full px-6 py-2 font-semibold shadow-card hover:opacity-90 transition">New Conference</button>
      </header>

      {/* Media Groups */}
      <section className="px-8 py-16 bg-gradient-to-br from-primary via-primaryDark to-accentLight">
        <h2 className="text-4xl font-bold text-card mb-10 text-center">Media Groups & Conferences</h2>
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {mediaGroups.map((group, i) => (
            <motion.div
              key={group.id}
              className="rounded-3xl bg-cardAlt shadow-card p-8 flex flex-col md:flex-row items-center gap-8"
              custom={i}
              variants={groupVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex flex-col items-center md:items-start md:w-56">
                <img src={group.logo} alt={group.name} className="w-24 h-24 rounded-2xl object-cover mb-4 border-4" style={{ borderColor: group.color }} />
                <div className="text-xl font-bold text-primary mb-1">{group.name}</div>
                <div className="text-md text-textSecondary mb-2">{group.industry}</div>
                <span className="bg-blueLight text-blue rounded-full px-4 py-1 text-sm font-semibold">{group.podcasts.length} Podcasts</span>
              </div>
              <div className="flex-1 grid gap-6">
                {group.podcasts.map((podcast, j) => (
                  <motion.div
                    key={podcast.title}
                    className="rounded-2xl bg-card shadow-card flex flex-col md:flex-row items-center p-6 gap-6"
                    variants={podcastVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <img src={podcast.image} alt={podcast.title} className="w-20 h-20 rounded-xl object-cover mb-4 md:mb-0" />
                    <div className="flex-1">
                      <div className="text-lg font-bold text-primary mb-1">{podcast.title}</div>
                      <div className="text-md text-textSecondary mb-1">Host: {podcast.host}</div>
                      <div className="flex gap-2 mb-2">
                        <span className="bg-accentLight text-accent rounded-full px-3 py-1 text-xs font-semibold">{podcast.duration}</span>
                        <span className="bg-blueLight text-blue rounded-full px-3 py-1 text-xs font-semibold">{podcast.listens} Listens</span>
                      </div>
                      <button className="bg-accent text-white rounded-full px-6 py-2 font-bold text-sm shadow-card hover:opacity-90 transition">View Podcast</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}