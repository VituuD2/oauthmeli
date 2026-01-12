export default function HomePage() {
  const appId = process.env.NEXT_PUBLIC_MELI_APP_ID;
  const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_MELI_REDIRECT_URI || '');
  
  const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${appId}&redirect_uri=${redirectUri}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h1>Teste OAuth MeLi + Vercel</h1>
      <p>Status: {appId ? '✅ Configurado' : '❌ Falta App ID'}</p>
      <a href={authUrl} style={{
        padding: '12px 24px',
        backgroundColor: '#FFE600',
        borderRadius: '6px',
        color: '#2D3277',
        fontWeight: 'bold',
        textDecoration: 'none'
      }}>
        Autorizar com Mercado Livre
      </a>
    </div>
  );
}