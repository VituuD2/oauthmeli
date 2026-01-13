'use client';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [connData, setConnData] = useState<any>(null);

  // Garante que o ID seja lido apenas no cliente para evitar 'undefined' no SSR
  useEffect(() => { setMounted(true); }, []);

  const appId = process.env.NEXT_PUBLIC_MELI_APP_ID || '8074300052363571';
  const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_MELI_REDIRECT_URI || '');
  const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${appId}&redirect_uri=${redirectUri}`;

  const handleDisconnect = async () => {
    if (!connData?.tokens?.access_token) return;
    
    const res = await fetch('/api/auth/meli/callback', {
      method: 'POST',
      body: JSON.stringify({ access_token: connData.tokens.access_token })
    });
    
    if (res.ok) {
      alert("Desconectado do Mercado Livre!");
      setConnData(null);
    }
  };

  if (!mounted) return null;

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Meli Integration Test</h1>
      
      {!connData ? (
        <a href={authUrl} style={{ background: '#FFE600', padding: '15px', borderRadius: '8px', color: '#2D3277', fontWeight: 'bold', textDecoration: 'none' }}>
          Conectar com Mercado Livre
        </a>
      ) : (
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '10px', display: 'inline-block' }}>
          <p style={{ color: 'green', fontWeight: 'bold' }}>● {connData.status}</p>
          <p>Usuário: <strong>{connData.user.nickname}</strong></p>
          <p>ID: {connData.user.id}</p>
          
          <button onClick={handleDisconnect} style={{ marginTop: '20px', padding: '10px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Desconectar App (Revogar Permissão)
          </button>
        </div>
      )}
    </div>
  );
}