import React from "react";

export type Episode = {
  id: string;
  number: number;
  image: string;
  title: string;
  host: string;
  category: string;
  duration: string;
};

export function EpisodeCard({ episode, onClick }: { episode: Episode; onClick?: (ep: Episode) => void }) {
  return (
    <div
      onClick={() => onClick?.(episode)}
      style={{
        background: 'var(--color-card)',
        borderRadius: 20,
        boxShadow: '0 4px 24px 0 rgba(45,28,19,0.08)',
        padding: 0,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.2s',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 260,
      }}
      onMouseOver={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px 0 rgba(79,140,255,0.12)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px) scale(1.02)';
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px 0 rgba(45,28,19,0.08)';
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden' }}>
        <img src={episode.image} alt={episode.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--color-blue-light)', color: 'var(--color-blue)', borderRadius: 8, padding: '2px 10px', fontWeight: 600, fontSize: 13 }}>
          Episode {episode.number}
        </div>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{episode.title}</div>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{episode.category}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span style={{ color: 'var(--color-blue)', fontWeight: 600 }}>{episode.duration}</span>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginLeft: 'auto' }}>{episode.host}</span>
        </div>
      </div>
    </div>
  );
} 