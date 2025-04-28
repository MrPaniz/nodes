import type { VercelRequest, VercelResponse } from '@vercel/node';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.ClientId,
  clientSecret: process.env.ClientSecret,
  redirectUri: process.env.REDIRECT_URI || 'https://estensione.onrender.com/api/callback'
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = req.query.code as string || null;

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];
    const expiresIn = data.body['expires_in'];

    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    setTimeout(() => refreshAccessToken(), (expiresIn - 60) * 1000);

    res.redirect('/');
  } catch (error) {
    console.error('Errore nell\'ottenere i token:', error);
    res.status(500).send('Errore durante l\'autenticazione');
  }
}

async function refreshAccessToken() {
  try {
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log('Access token rinnovato con successo');
  } catch (error) {
    console.error('Errore nel rinnovare l\'access token:', error);
  }
}
