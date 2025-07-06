import React from "react";

export function EpisodeTable({ episodes }: { episodes: Array<{ id: string; number: number; title: string; host: string; category: string; duration: string; status: string; createdAt: string }> }) {
  return (
    <table style={{ width: '100%', background: 'var(--color-card)', borderRadius: 20, boxShadow: '0 4px 24px 0 rgba(45,28,19,0.08)', marginTop: 32 }}>
      <thead>
        <tr style={{ color: 'var(--color-text-secondary)', textAlign: 'left' }}>
          <th style={{ padding: 16 }}>#</th>
          <th>Title</th>
          <th>Host</th>
          <th>Category</th>
          <th>Duration</th>
          <th>Status</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {episodes.map((ep) => (
          <tr key={ep.id} style={{ borderTop: '1px solid #ececec' }}>
            <td style={{ padding: 16, fontWeight: 700 }}>{ep.number}</td>
            <td>{ep.title}</td>
            <td>{ep.host}</td>
            <td>{ep.category}</td>
            <td>{ep.duration}</td>
            <td>
              <span style={{ padding: '4px 16px', borderRadius: 999, background: 'var(--color-blue-light)', color: 'var(--color-blue)', fontSize: 12 }}>
                {ep.status}
              </span>
            </td>
            <td>{new Date(ep.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
} 