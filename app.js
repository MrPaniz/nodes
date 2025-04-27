const express = require("express");
require('dotenv').config();
const querystring = require('querystring');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');

// Inizializzazione app Express
const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());
const port = process.env.PORT || 80;

// Configurazione Spotify
const clientId = process.env.ClientId;
const clientSecret = process.env.ClientSecret;
const redirect_uri = 'https://estensione.onrender.com/api/callback';

// Istanza di Spotify API
let spotifyApi = new SpotifyWebApi({
  clientId,
  clientSecret,
  redirectUri: redirect_uri
});

// Funzione per rinnovare l'access token
async function refreshAccessToken() {
  try {
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log('Access token rinnovato con successo');
    return true;
  } catch (error) {
    console.error('Errore nel rinnovare l\'access token:', error);
    return false;
  }
}

// Endpoint per il login con Spotify
app.get('/api/login', (req, res) => {
  const state = "spotify_auth_state";
  const scope = 'user-read-private user-read-email user-modify-playback-state user-read-playback-state';
  
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

// Endpoint di callback dopo l'autenticazione
app.get('/api/callback', async (req, res) => {
  const code = req.query.code || null;
  
  try {
    // Ottieni access token e refresh token
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];
    const expiresIn = data.body['expires_in'];
    
    // Imposta i token nell'istanza di Spotify API
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);
    
    // Imposta un timer per rinnovare il token automaticamente
    setTimeout(() => refreshAccessToken(), (expiresIn - 60) * 1000);
    
    // Redirect alla home
    res.redirect('/');
  } catch (error) {
    console.error('Errore nell\'ottenere i token:', error);
    res.status(500).send('Errore durante l\'autenticazione');
  }
});

// Endpoint di base
app.get('/', (req, res) => {
  res.status(200).send('Server operativo');
});

// Aggiungi una traccia alla coda di riproduzione
app.post('/api/queue', async (req, res) => {
  try {
    // Verifica se abbiamo un token valido
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
    
    // Gestione specifica degli errori di autenticazione
    if (error.statusCode === 401) {
      try {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return res.status(401).json({ 
            error: 'Token rinnovato, riprova', 
            success: false,
            tokenRefreshed: true
          });
        }
      } catch (refreshError) {
        // Continua con l'errore generico
      }
    }
    
    res.status(500).json({ 
      error: error.message || 'Errore del server', 
      success: false 
    });
  }
});

// Endpoint per verificare lo stato dell'autenticazione
app.get('/api/status', (req, res) => {
  const isAuthorized = !!spotifyApi.getAccessToken();
  res.status(200).json({ authorized: isAuthorized });
});

// Avvia il server
app.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});