'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AvatarPortrait } from './avatar-portrait';
const MobileProfileCard = dynamic(
  () => import('@/components/Profile/MobileProfileCard'),
  { ssr: false },
);

export function AvatarPlayground() {
  const [arOpen, setArOpen] = useState(false);
  return (
    <>
      <div className="dedicated-avatar">
        <AvatarPortrait autoLoad={false} />
      </div>
      <details
        className="avatar-ar"
        onToggle={(event) => setArOpen(event.currentTarget.open)}
      >
        <summary>Augmented reality</summary>
        {arOpen ? <MobileProfileCard /> : null}
      </details>
    </>
  );
}
