'use client';
import { useState, useEffect } from 'react';
import { generateCodeVerifier, generateCodeChallenge } from '@/utils/pkce';
import Cookies from 'js-cookie';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [connData, setConnData] = useState<any>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    Cookies.set('meli_code_verifier', verifier, { expires: 1/144 }); // 10 min

    const appId = process.env.NEXT_PUBLIC_MELI_APP_ID || '8074300052363571';
    // Garante que a URI de redirect seja exatamente a mesma cadastrada
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_MELI_REDIRECT_URI || 'https://2pack-pearl.vercel.app/api/auth/meli/callback');
    
    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${appId}&redirect_uri=${redirectUri}&code_challenge=${challenge}&code_challenge_method=S256`;

    window.location.href = authUrl;
  };

  const handleTestSync = async () => {
    if (!accessToken) {
      alert('Por favor, insira um Access Token primeiro.');
      return;
    }
    setMsg('Verificando...');
    try {
      const res = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setConnData(data);
        setMsg('Sincronização OK!');
      } else {
        setConnData(null);
        setMsg(`Erro: ${data.message || res.statusText}`);
      }
    } catch (error) {
      setMsg('Erro ao conectar com API do Meli.');
    }
  };

  const handleDisconnect = async () => {
    if (!accessToken) {
      alert('Por favor, insira um Access Token primeiro.');
      return;
    }
    setMsg('Desconectando...');
    try {
      // Chama nossa rota de backend que faz o DELETE na API do Meli
      const res = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMsg(data.message || 'Desconectado com sucesso!');
        setConnData(null);
        setAccessToken('');
      } else {
        setMsg(`Erro ao desconectar: ${JSON.stringify(data.error)}`);
      }
    } catch (error) {
      setMsg('Erro na requisição de desconexão.');
    }
  };

  if (!mounted) return null;

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Integração Mercado Livre (PKCE)</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleLogin} 
          style={{ background: '#FFE600', padding: '15px', border: 'none', borderRadius: '8px', color: '#2D3277', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
        >
          1. Conectar (Login)
        </button>
        <p style={{fontSize: '0.9em', color: '#666'}}>
          Ao clicar, você será redirecionado. Após o login, copie o <code>access_token</code> do JSON exibido e cole abaixo.
        </p>
      </div>

      <hr style={{margin: '30px 0'}} />

      <div style={{ marginBottom: '20px' }}>
        <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Access Token:</label>
        <input 
          type="text" 
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value.trim())}
          placeholder="Cole seu access_token aqui..."
          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={handleTestSync}
          style={{ flex: 1, padding: '12px', background: '#009EE3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          2. Verificar Sincronização
        </button>

        <button 
          onClick={handleDisconnect}
          style={{ flex: 1, padding: '12px', background: '#F23D4F', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          3. Desconectar App
        </button>
      </div>

      {msg && <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '5px', marginBottom: '10px' }}><strong>Status:</strong> {msg}</div>}

      {connData && (
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '10px', marginTop: '20px', background: '#f9f9f9' }}>
          <h3>Dados do Usuário Conectado:</h3>
          <p><strong>ID:</strong> {connData.id}</p>
          <p><strong>Nickname:</strong> {connData.nickname}</p>
          <p><strong>Email:</strong> {connData.email}</p>
          <p><strong>Site:</strong> {connData.site_id}</p>
        </div>
      )}
    </div>
  );
}
