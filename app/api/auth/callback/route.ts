import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // Valores fixos como fallback se a ENV falhar no servidor
  const clientId = process.env.NEXT_PUBLIC_MELI_APP_ID || '8074300052363571';
  const clientSecret = process.env.MELI_APP_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_MELI_REDIRECT_URI || 'https://2pack-pearl.vercel.app/api/auth/meli/callback';

  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

  try {
    // 1. Troca o código pelo Token
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret!,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) throw new Error(data.message || 'Token exchange failed');

    // 2. Teste de Conexão: Busca dados do usuário para validar o Access Token
    const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { 'Authorization': `Bearer ${data.access_token}` }
    });
    
    const userData = await userResponse.json();

    return NextResponse.json({
      status: 'Conectado',
      user: {
        id: userData.id,
        nickname: userData.nickname,
        email: userData.email
      },
      tokens: {
        access_token: data.access_token, // Cuidado: Em produção, não retorne o token completo no JSON
        refresh_token: data.refresh_token
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ROTA PARA DESCONEXÃO (Revogação)
export async function POST(request: Request) {
  const { access_token } = await request.json();
  const clientId = process.env.NEXT_PUBLIC_MELI_APP_ID || '8074300052363571';

  try {
    // Segundo a doc do MeLi, a revogação invalida o grant entre app e usuário
    const response = await fetch(`https://api.mercadolibre.com/users/me/applications/${clientId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (response.ok) {
      return NextResponse.json({ message: 'Aplicação desconectada com sucesso!' });
    } else {
      const err = await response.json();
      return NextResponse.json({ error: err }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao desconectar' }, { status: 500 });
  }
}