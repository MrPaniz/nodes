import type { VercelRequest, VercelResponse } from '@vercel/node';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.ClientId,
  clientSecret: process.env.ClientSecret,
  redirectUri: process.env.REDIRECT_URI || 'https://estensione.onrender.com/api/callback'
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!spotifyApi.getAccessToken()) {
      return res.status(401).json({ error: 'Autenticazione richiesta', success: false });
    }

    const trackName = req.body.track;
    if (!trackName) {
      return res.status(400).json({ error: 'Nome della traccia mancante', success: false });
    }

    const data = await spotifyApi.searchTracks(trackName);
    if (!data.body.tracks.items.length) {
      return res.status(404).json({ error: 'Traccia non trovata', success: false });
    }

    const trackId = data.body.tracks.items[0].id;
    await spotifyApi.addToQueue(`spotify:track:${trackId}`);

    res.status(200).json({
      success: true,
      message: 'Traccia aggiunta alla coda',
      track: {
        name: data.body.tracks.items[0].name,
        artist: data.body.tracks.items[0].artists[0].name,
        id: trackId
      }
    });
  } catch (error) {
    console.error('Errore nell\'aggiungere la traccia:', error);
    res.status(500).json({ error: error.message || 'Errore del server', success: false });
  }
}
