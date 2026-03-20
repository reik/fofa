// MessagesPage.tsx
import React from 'react';
import { MessagesPanel } from '../components/messages/MessagesPanel';

export const MessagesPage: React.FC = () => (
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 500, color: 'var(--c-brand-dark)', marginBottom: 24 }}>
      Messages
    </h1>
    <MessagesPanel />
  </div>
);
