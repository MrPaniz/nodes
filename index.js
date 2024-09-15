const express = require("express");//
require('dotenv').config()//
const querystring = require('querystring');//
const axios = require("axios");//
const SpotifyWebApi = require('spotify-web-api-node');//
const cors = require('cors');//
const app = express();
app.use(cors());
const port = process.env.PORT || 80; 

// Configurazione delle variabili di ambiente
const clientId = process.env.ClientId;
const clientSecret = process.env.ClientSecret;
const redirect_uri = 'https://estensione.onrender.com/callback'; // Modifica l'URL di redirect appropriato

let spotifyApi;
//chiamata per loop a se stesso. 


app.use(express.static('public'));
app.use(express.json());

// Gestione del login con Spotify
app.get('/login', (req, res) => {
    const state =  "byuefueioqfefwpo"
    const scope = 'user-read-private user-read-email user-modify-playback-state';

    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
        response_type: 'code',
        client_id: clientId,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    }));
});

app.get('/', (req, res) => {
    res.status(200).send('Ok');
    
})


// Callback dopo il login
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  try {
    const credentials = {
      clientId: clientId,
      clientSecret: clientSecret,
      redirectUri: redirect_uri
    };

    spotifyApi = new SpotifyWebApi(credentials);

    // Ottieni access token e refresh token
    const data = await spotifyApi.authorizationCodeGrant(code);

    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi.setRefreshToken(data.body['refresh_token']);

    // Avvia il refresh automatico dell'access token prima della sua scadenza
    setInterval(async () => {
      try {
            const refreshData = await spotifyApi.refreshAccessToken();
            console.log('The access token has been refreshed!');
            spotifyApi.setAccessToken(refreshData.body['access_token']);
      } catch (err) {
            console.log('Could not refresh access token', err);
      }
    }, (data.body['expires_in'] - 60) * 1000);

    res.redirect('/'); 
  } catch (err) {
    console.log('Something went wrong!', err);
    res.status(500).send('Internal Server Error');
  }
});

// Aggiungi una traccia alla coda di riproduzione. 
app.post('/track', async (req, res) => {
  try {
    const trackName = req.body.track;
    const data = await spotifyApi.searchTracks(trackName);
    const trackId = data.body.tracks.items[0].id;

    await spotifyApi.addToQueue(`spotify:track:${trackId}`);
    console.log("Track added to queue");
    res.sendStatus(200);
  } catch (err) {
    console.log('Error adding track to queue', err);
    res.status(500).send('Internal Server Error');
  }
});

// Avvia il server
app.listen(port, () => {
  console.log(`Server listening at port: ${port}`);
});


const makeRequest = async () => {
    try {
      await axios.get( `https://estensione.onrender.com/`);
        console.log('GET request to localhost successful');
    } catch (error) {
      console.error('Error making GET request:', error.message);
    }
  };

  const interval = setInterval(makeRequest, 5000);
//
