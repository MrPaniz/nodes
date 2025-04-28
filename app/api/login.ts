import type { VercelRequest, VercelResponse } from '@vercel/node';
import querystring from 'querystring';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.ClientId;
  const redirectUri = process.env.REDIRECT_URI || 'https://estensione.onrender.com/api/callback';
  const state = "spotify_auth_state";
  const scope = 'user-read-private user-read-email user-modify-playback-state user-read-playback-state';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      state: state
    }));
}
