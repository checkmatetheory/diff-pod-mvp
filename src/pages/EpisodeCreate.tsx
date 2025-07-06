import React, { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { EpisodeUpload } from "../components/ui/EpisodeUpload";
import { Button } from "../components/ui/button";

export default function EpisodeCreate() {
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
    setStep('done');
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 32 }}>Create Podcast Episode</h1>
        {step === 'upload' && (
          <EpisodeUpload onUpload={file => { setFile(file); processFile(file); }} />
        )}
        {step === 'edit' && (
          <div style={{ background: 'var(--color-card)', borderRadius: 20, boxShadow: '0 4px 24px 0 rgba(45,28,19,0.08)', padding: 32, marginTop: 32 }}>
            <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 16 }}>Edit Episode Details</h2>
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
            <Button onClick={handlePublish}>Publish Episode</Button>
          </div>
        )}
        {step === 'done' && (
          <div style={{ background: 'var(--color-blue-light)', borderRadius: 20, padding: 32, marginTop: 32, textAlign: 'center' }}>
            <h2 style={{ color: 'var(--color-blue)', fontWeight: 700, fontSize: 22 }}>Episode Published!</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 12 }}>Your podcast episode is now live and ready to share.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
} 