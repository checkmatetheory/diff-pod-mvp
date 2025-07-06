import React, { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { BrandGrid, Brand } from "../components/ui/BrandGrid";
import { EpisodeCard, Episode } from "../components/ui/EpisodeCard";
import { Button } from "../components/ui/button";
import { EpisodeUpload } from "../components/ui/EpisodeUpload";
import { AnalyticsCards } from "../components/dashboard/AnalyticsCards";
import { SponsorCards, Sponsor } from "../components/dashboard/SponsorCards";
import { VideoSocialRoadmap } from "../components/dashboard/VideoSocialRoadmap";

// Sample data for demo
const initialBrands: Brand[] = [
  {
    id: "billboard",
    name: "Billboard",
    logo: "/logos/billboard.png",
    established: "Est. 1894",
    color: "#4F8CFF",
  },
  {
    id: "cedia",
    name: "CEDIA Expo",
    logo: "/logos/cedia.png",
    established: "Est. 1989",
    color: "#FF7A1A",
  },
  {
    id: "egypt-mining",
    name: "Egypt Mining Forum",
    logo: "/logos/egypt-mining.png",
    established: "Est. 2025",
    color: "#2D1C13",
  },
];

const initialEpisodes: Record<string, Episode[]> = {
  billboard: [
    {
      id: "ep1",
      number: 1,
      image: "/episodes/ep1.jpg",
      title: "Music Industry Trends 2024",
      host: "Jane Smith",
      category: "Industry Analysis",
      duration: "1 hr 10 mins",
    },
    {
      id: "ep2",
      number: 2,
      image: "/episodes/ep2.jpg",
      title: "Top 10 Albums of the Year",
      host: "John Doe",
      category: "Music Review",
      duration: "55 mins",
    },
  ],
  cedia: [
    {
      id: "ep1",
      number: 1,
      image: "/episodes/cedia1.jpg",
      title: "Smart Home Innovations",
      host: "Alex Lee",
      category: "Technology",
      duration: "48 mins",
    },
  ],
  "egypt-mining": [
    {
      id: "ep1",
      number: 1,
      image: "/episodes/mining1.jpg",
      title: "Mining in North Africa",
      host: "Fatima Hassan",
      category: "Mining & Resources",
      duration: "1 hr 20 mins",
    },
  ],
};

// Demo stats per brand
const demoStats: Record<string, { episodes: number; listens: number; revenue: number }> = {
  billboard: { episodes: 2, listens: 12000, revenue: 3400 },
  cedia: { episodes: 1, listens: 4200, revenue: 900 },
  "egypt-mining": { episodes: 1, listens: 1800, revenue: 500 },
};

// Demo sponsors per brand
const demoSponsors: Record<string, Sponsor[]> = {
  billboard: [
    { id: 'spotify', name: 'Spotify', logo: '/sponsors/spotify.png', adReads: 12, revenue: 1200 },
    { id: 'apple', name: 'Apple Music', logo: '/sponsors/apple.png', adReads: 8, revenue: 900 },
  ],
  cedia: [
    { id: 'sonos', name: 'Sonos', logo: '/sponsors/sonos.png', adReads: 5, revenue: 400 },
  ],
  "egypt-mining": [
    { id: 'miningco', name: 'MiningCo', logo: '/sponsors/miningco.png', adReads: 3, revenue: 250 },
  ],
};

function EpisodeCreateInline({ brandId, onPublish, onCancel }: { brandId: string; onPublish: (ep: Episode) => void; onCancel: () => void }) {
  const [step, setStep] = useState<'upload' | 'edit' | 'done'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [transcript, setTranscript] = useState('');

  // Simulate AI processing
  const processFile = (file: File) => {
    setStep('edit');
    setTitle('AI Generated Title for ' + file.name);
    setDescription('This is an AI-generated description based on the transcript of ' + file.name + '.');
    setTranscript('This is a simulated transcript for ' + file.name + '.\nLorem ipsum dolor sit amet, consectetur adipiscing elit.');
  };

  const handlePublish = () => {
    const newEpisode: Episode = {
      id: 'ep' + Math.random().toString(36).slice(2, 8),
      number: 0, // Will be set by parent
      image: "/episodes/placeholder.jpg",
      title,
      host: "You",
      category: "AI Generated",
      duration: "TBD",
    };
    onPublish(newEpisode);
    setStep('done');
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', marginTop: 32 }}>
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 16 }}>Create Podcast Episode</h2>
      {step === 'upload' && (
        <EpisodeUpload onUpload={file => { setFile(file); processFile(file); }} />
      )}
      {step === 'edit' && (
        <div style={{ background: 'var(--color-card)', borderRadius: 20, boxShadow: '0 4px 24px 0 rgba(45,28,19,0.08)', padding: 32, marginTop: 32 }}>
          <label style={{ fontWeight: 500 }}>Title</label>
          <input
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ececec', marginBottom: 16, marginTop: 4 }}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <label style={{ fontWeight: 500 }}>Description</label>
          <textarea
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ececec', marginBottom: 16, marginTop: 4, minHeight: 80 }}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <label style={{ fontWeight: 500 }}>Transcript (read-only)</label>
          <textarea
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ececec', background: '#f6f6f6', color: '#888', marginBottom: 24, marginTop: 4, minHeight: 120 }}
            value={transcript}
            readOnly
          />
          <div style={{ display: 'flex', gap: 16 }}>
            <Button onClick={handlePublish}>Publish Episode</Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      )}
      {step === 'done' && (
        <div style={{ background: 'var(--color-blue-light)', borderRadius: 20, padding: 32, marginTop: 32, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-blue)', fontWeight: 700, fontSize: 22 }}>Episode Published!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 12 }}>Your podcast episode is now live and ready to share.</p>
          <Button style={{ marginTop: 16 }} onClick={onCancel}>Back to Episodes</Button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [brands] = useState<Brand[]>(initialBrands);
  const [episodes, setEpisodes] = useState<Record<string, Episode[]>>(initialEpisodes);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handlePublish = (ep: Episode) => {
    if (!selectedBrand) return;
    const groupEpisodes = episodes[selectedBrand.id] || [];
    const newEp = { ...ep, number: groupEpisodes.length + 1 };
    setEpisodes({
      ...episodes,
      [selectedBrand.id]: [newEp, ...groupEpisodes],
    });
    setShowCreate(false);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {!selectedBrand ? (
          <>
            <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 32 }}>Your Media Groups</h1>
            <BrandGrid brands={brands} onSelect={setSelectedBrand} />
          </>
        ) : (
          <>
            <button
              style={{ marginBottom: 32, color: 'var(--color-blue)', background: 'none', border: 'none', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
              onClick={() => { setSelectedBrand(null); setShowCreate(false); }}
            >
              ← Back to Media Groups
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
              <img src={selectedBrand.logo} alt={selectedBrand.name} style={{ height: 48 }} />
              <h2 style={{ fontWeight: 700, fontSize: 28 }}>{selectedBrand.name}</h2>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>{selectedBrand.established}</span>
              <Button style={{ marginLeft: 'auto' }} onClick={() => setShowCreate(true)}>
                + Create Episode
              </Button>
            </div>
            <AnalyticsCards stats={demoStats[selectedBrand.id] || { episodes: 0, listens: 0, revenue: 0 }} />
            <SponsorCards sponsors={demoSponsors[selectedBrand.id] || []} />
            {showCreate && (
              <EpisodeCreateInline
                brandId={selectedBrand.id}
                onPublish={handlePublish}
                onCancel={() => setShowCreate(false)}
              />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
              {episodes[selectedBrand.id]?.map((ep) => (
                <EpisodeCard key={ep.id} episode={ep} />
              ))}
            </div>
            <VideoSocialRoadmap />
          </>
        )}
      </div>
    </AppShell>
  );
} 