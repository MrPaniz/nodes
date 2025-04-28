import type { VercelRequest, VercelResponse } from '@vercel/node';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.ClientId,
  clientSecret: process.env.ClientSecret,
  redirectUri: process.env.REDIRECT_URI || 'https://estensione.onrender.com/api/callback'
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  const isAuthorized = !!spotifyApi.getAccessToken();
  res.status(200).json({ authorized: isAuthorized });
}
