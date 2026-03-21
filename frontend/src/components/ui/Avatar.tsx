import React from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  style?: React.CSSProperties;
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const palette = ['#3d7a4f','#2c5c3a','#e9a23b','#c8861e','#2563eb','#7c3aed','#db2777'];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 40, style }) => {
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';
  const fullSrc = src
    ? (src.startsWith('http') || src.startsWith('blob:') ? src : `${apiBase}${src}`)
    : null;

  if (fullSrc) {
    return (
      <img
        src={fullSrc}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size, ...style }}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        background: colorFor(name),
        fontSize: size * 0.38,
        ...style,
      }}
    >
      {initials(name)}
    </div>
  );
};
