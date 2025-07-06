import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: "🎙️",
    title: "Podcast Episodes",
    description: "Turn ideas into episodes with beautiful, modern cards and smooth animations.",
    color: "bg-blueLight text-blue",
  },
  {
    icon: "📊",
    title: "Analytics",
    description: "Track your growth with minimal, easy-to-read analytics widgets.",
    color: "bg-accentLight text-accent",
  },
  {
    icon: "🧑‍💼",
    title: "Host Profiles",
    description: "Showcase your hosts with profile cards and social links.",
    color: "bg-blueLight text-blue",
  },
];

const EASE = [0.4, 0, 0.2, 1];

const heroVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

const featureVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.15, duration: 0.7 },
  }),
};

const podcastCardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7 } },
};

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-primary flex flex-col font-sans">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-6 bg-primary">
        <div className="flex items-center gap-3">
          <img 
            src="/diffused-logo.svg" 
            alt="Diffused Podcasts" 
            className="h-8 w-auto"
          />
        </div>
        <nav className="flex gap-8 text-cardAlt text-lg font-medium">
          <a href="#episodes" className="hover:text-accent transition">Episodes</a>
          <a href="#features" className="hover:text-accent transition">Features</a>
          <a href="#hosts" className="hover:text-accent transition">Hosts</a>
          <a href="#about" className="hover:text-accent transition">About</a>
        </nav>
        <button className="bg-accent text-white rounded-full px-6 py-2 font-semibold shadow-card hover:opacity-90 transition">Subscribe</button>
      </header>

      {/* Hero Section */}
      <motion.section
        className="flex flex-col md:flex-row items-center justify-between px-8 py-20 bg-gradient-to-br from-primary via-primaryDark to-accentLight"
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-xl">
          <h1 className="text-5xl md:text-6xl font-extrabold text-card mb-6 leading-tight">
            Turn Conference Content Into <span className="text-accent">Podcasts</span>,<br />Events Into <span className="text-blue">Insights</span>
          </h1>
          <p className="text-xl text-cardAlt mb-8">
            Transform your conference recordings into engaging AI-powered podcasts. Minimal, beautiful, and fast.
          </p>
          <div className="flex gap-4">
            <button 
              className="bg-accent text-white rounded-full px-8 py-4 font-bold text-lg shadow-card hover:opacity-90 transition"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </button>
            <button 
              className="bg-blue text-white rounded-full px-8 py-4 font-bold text-lg shadow-card hover:opacity-90 transition"
              onClick={() => navigate("/browse")}
            >
              Browse Content
            </button>
          </div>
        </div>
        <div className="mt-12 md:mt-0 md:ml-16 flex-shrink-0">
          {/* Placeholder for hero image or animation */}
          <motion.div
            className="w-80 h-80 rounded-3xl bg-cardAlt flex items-center justify-center shadow-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <span className="text-[7rem]">🎧</span>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <section id="features" className="px-8 py-20 bg-background">
        <h2 className="text-4xl font-bold text-primary mb-12 text-center">Features That Enhance Your Experience</h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className={`rounded-2xl p-8 shadow-card ${f.color} flex flex-col items-center`}
              custom={i}
              variants={featureVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="text-5xl mb-4">{f.icon}</div>
              <div className="text-2xl font-bold mb-2">{f.title}</div>
              <div className="text-lg text-textSecondary text-center">{f.description}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sample Podcast Card */}
      <section id="episodes" className="px-8 py-20 bg-cardAlt">
        <h2 className="text-4xl font-bold text-primary mb-12 text-center">Featured Episode</h2>
        <motion.div
          className="max-w-2xl mx-auto rounded-3xl bg-card shadow-card flex flex-col md:flex-row items-center p-8 gap-8"
          variants={podcastCardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="w-40 h-40 rounded-2xl bg-blueLight flex items-center justify-center">
            <span className="text-6xl">🎤</span>
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold text-primary mb-2">The Curious Mind Podcast</div>
            <div className="text-md text-textSecondary mb-4">with Kristin Watson</div>
            <div className="flex gap-4 items-center mb-4">
              <span className="bg-accentLight text-accent rounded-full px-4 py-1 text-sm font-semibold">150K Listens</span>
              <span className="bg-blueLight text-blue rounded-full px-4 py-1 text-sm font-semibold">45 mins</span>
            </div>
            <button className="bg-accent text-white rounded-full px-8 py-3 font-bold text-lg shadow-card hover:opacity-90 transition">Listen Now</button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
