import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
        }}
      >
        <div style={{ display: 'flex', width: 112, height: 16, background: '#052e21', borderRadius: 8, opacity: 0.4, transform: 'translateY(34px) rotate(-18deg)' }} />
        <div style={{ display: 'flex', width: 112, height: 16, background: '#052e21', borderRadius: 8, opacity: 0.7, transform: 'translateY(6px) rotate(-18deg)' }} />
        <div style={{ display: 'flex', width: 112, height: 16, background: '#052e21', borderRadius: 8, transform: 'translateY(-22px) rotate(-18deg)' }} />
      </div>
    ),
    { ...size }
  );
}
