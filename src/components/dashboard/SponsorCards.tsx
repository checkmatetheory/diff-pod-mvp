import React from "react";
import { Button } from "../ui/button";

export type Sponsor = {
  id: string;
  name: string;
  logo: string;
  adReads: number;
  revenue: number;
};

export function SponsorCards({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 20 }}>Sponsors & Ads</h3>
        <Button variant="outline">+ Add Sponsor</Button>
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        {sponsors.map((sponsor) => (
          <div
            key={sponsor.id}
            style={{
              background: 'var(--color-card)',
              borderRadius: 16,
              boxShadow: '0 2px 12px 0 rgba(45,28,19,0.08)',
              padding: 24,
              minWidth: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <img src={sponsor.logo} alt={sponsor.name} style={{ height: 40, marginBottom: 8, objectFit: 'contain' }} />
            <div style={{ fontWeight: 600, fontSize: 16 }}>{sponsor.name}</div>
            <div style={{ color: 'var(--color-blue)', fontWeight: 500, fontSize: 14 }}>{sponsor.adReads} Ad Reads</div>
            <div style={{ color: 'var(--color-accent)', fontWeight: 500, fontSize: 14 }}>${sponsor.revenue.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 