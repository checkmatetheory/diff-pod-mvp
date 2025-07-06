import React from "react";
import { FiVideo, FiInstagram, FiTwitter, FiLinkedin } from "react-icons/fi";

export function VideoSocialRoadmap() {
  return (
    <div style={{
      background: 'var(--color-blue-light)',
      borderRadius: 20,
      padding: 32,
      marginTop: 48,
      textAlign: 'center',
      boxShadow: '0 2px 12px 0 rgba(79,140,255,0.08)',
      color: 'var(--color-blue)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 16 }}>
        <FiVideo size={40} />
        <FiLinkedin size={36} />
        <FiInstagram size={36} />
        <FiTwitter size={36} />
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Video Reels & Social Distribution</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
        <strong>Coming Soon:</strong> Instantly generate video reels from your podcast episodes and distribute them to all your social channels—LinkedIn, Instagram, Twitter, and more. Turn every episode into a multi-format, multi-channel content engine.
      </p>
    </div>
  );
} 