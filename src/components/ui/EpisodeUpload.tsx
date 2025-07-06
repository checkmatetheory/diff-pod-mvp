import React, { useState } from "react";
import { Button } from "./button";

export function EpisodeUpload({ onUpload }: { onUpload: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null);
  const handleUpload = () => {
    if (file) onUpload(file);
  };

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 20, boxShadow: '0 4px 24px 0 rgba(45,28,19,0.08)', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Upload Content to Create Podcast Episode</h2>
      <input type="file" accept=".pdf,.mp4,.mp3,.docx,.txt" onChange={handleFileChange} />
      <Button onClick={handleUpload} disabled={!file}>Upload & Generate</Button>
    </div>
  );
} 