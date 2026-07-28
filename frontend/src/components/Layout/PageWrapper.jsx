import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function PageWrapper({ title, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title={title} />
        <main style={{ marginLeft: '240px', padding: '32px', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
