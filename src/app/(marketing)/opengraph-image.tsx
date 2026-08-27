import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'weplan - Undangan Pernikahan Digital';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to right, #faf8f5, #f5f0ea)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h1 style={{ fontSize: 80, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.02em', marginBottom: 20 }}>
          weplan
        </h1>
        <p style={{ fontSize: 40, color: '#6b7280' }}>
          Undangan yang terasa seperti milik kalian.
        </p>
      </div>
    ),
    { ...size }
  );
}
