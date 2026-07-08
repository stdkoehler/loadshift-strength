import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#10b981',
          borderRadius: 7,
        }}
      >
        <div style={{ display: 'flex', width: 20, height: 3, background: '#052e21', borderRadius: 2, opacity: 0.4, transform: 'translateY(6px) rotate(-18deg)' }} />
        <div style={{ display: 'flex', width: 20, height: 3, background: '#052e21', borderRadius: 2, opacity: 0.7, transform: 'translateY(1px) rotate(-18deg)' }} />
        <div style={{ display: 'flex', width: 20, height: 3, background: '#052e21', borderRadius: 2, transform: 'translateY(-4px) rotate(-18deg)' }} />
      </div>
    ),
    { ...size }
  );
}
