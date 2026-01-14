import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  // 1. Recupera o verifier do cookie
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get('meli_code_verifier')?.value;

  if (!code || !codeVerifier) {
    return NextResponse.json({ error: "Missing code or verifier" }, { status: 400 });
  }

  // Valores fixos como fallback se a ENV falhar no servidor
  const clientId = process.env.NEXT_PUBLIC_MELI_APP_ID || '8074300052363571';
  const clientSecret = process.env.MELI_APP_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_MELI_REDIRECT_URI || 'https://2pack-pearl.vercel.app/api/auth/meli/callback';

  try {
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret!,
        code: code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier // PARÂMETRO OBRIGATÓRIO AGORA
      }),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) return NextResponse.json(data, { status: 400 });

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
        access_token: data.access_token,
        refresh_token: data.refresh_token
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// ROTA PARA DESCONEXÃO (Revogação)
export async function POST(request: Request) {
  const { access_token } = await request.json();
  const clientId = process.env.NEXT_PUBLIC_MELI_APP_ID || '8074300052363571';

  try {
    // 1. Obter ID do usuário para garantir que o endpoint de revogação funcione (o alias 'me' pode falhar)
    const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    
    if (!userResponse.ok) {
       const userErr = await userResponse.json();
       return NextResponse.json({ error: userErr, stage: 'fetch_user' }, { status: 400 });
    }
    
    const userData = await userResponse.json();

    // 2. Revogar permissão usando o ID explícito
    const response = await fetch(`https://api.mercadolibre.com/users/${userData.id}/applications/${clientId}`, {
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
