import React from "react";

export type Brand = {
  id: string;
  name: string;
  logo: string;
  established: string;
  color?: string;
};

export function BrandGrid({ brands, onSelect }: { brands: Brand[]; onSelect?: (brand: Brand) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
      {brands.map((brand) => (
        <div
          key={brand.id}
          onClick={() => onSelect?.(brand)}
          style={{
            background: 'var(--color-card)',
            borderRadius: 20,
            boxShadow: '0 4px 24px 0 rgba(45,28,19,0.08)',
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            borderTop: `4px solid ${brand.color || 'var(--color-blue)'}`,
            transition: 'box-shadow 0.2s, transform 0.2s',
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
          <img src={brand.logo} alt={brand.name} style={{ height: 48, marginBottom: 24, objectFit: 'contain' }} />
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>{brand.name}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{brand.established}</div>
        </div>
      ))}
    </div>
  );
} 