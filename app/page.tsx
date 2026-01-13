'use client';
import { useState, useEffect } from 'react';
import { generateCodeVerifier, generateCodeChallenge } from '@/utils/pkce';
import Cookies from 'js-cookie';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [connData, setConnData] = useState<any>(null);

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async () => {
    // 1. Gera as chaves PKCE
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    // 2. Salva o verifier em um cookie para o backend ler depois
    Cookies.set('meli_code_verifier', verifier, { expires: 1/144 }); // expira em 10 min

    const appId = process.env.NEXT_PUBLIC_MELI_APP_ID || '8074300052363571';
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_MELI_REDIRECT_URI || '');
    
    // 3. Monta a URL com challenge e o método S256
    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${appId}&redirect_uri=${redirectUri}&code_challenge=${challenge}&code_challenge_method=S256`;

    window.location.href = authUrl;
  };

  // ... (mantenha a função handleDisconnect do código anterior)

  if (!mounted) return null;

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Meli Integration Test</h1>
      
      {!connData ? (
        <button 
          onClick={handleLogin} 
          style={{ background: '#FFE600', padding: '15px', border: 'none', borderRadius: '8px', color: '#2D3277', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Conectar com Mercado Livre (PKCE)
        </button>
      ) : (
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '10px', display: 'inline-block' }}>
          {/* ... resto do seu layout de sucesso */}
        </div>
      )}
    </div>
  );
}