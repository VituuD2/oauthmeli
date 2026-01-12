import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

  try {
    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_MELI_APP_ID!,
        client_secret: process.env.MELI_APP_SECRET!, // Seguro aqui no servidor
        code: code,
        redirect_uri: process.env.NEXT_PUBLIC_MELI_REDIRECT_URI!,
      }),
    });

    const data = await response.json();

    return NextResponse.json({
      status: 'Sucesso!',
      message: 'As variáveis de ambiente funcionaram!',
      user_id: data.user_id,
      token_preview: data.access_token?.substring(0, 15) + '...'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro na troca do token' }, { status: 500 });
  }
}