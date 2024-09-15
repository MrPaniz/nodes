const express = require('express');
require('dotenv').config();
const apiKey = process.env.API_KEY 
const app = express(); 
const cors = require('cors');
app.use(cors())
app.use(express.json());
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(apiKey || process.env.API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});


const clientId = process.env.ClientId;
const clientSecret = process.env.ClientSecret;
const redirect_uri = 'https://estensione.onrender.com/callback'; // Modifica l'URL di redirect appropriato



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


app.get('/ailink', async (req, res) => {  
  lan = req.query.lan;
  link = req.query.link;  
  var text = await getAiData(lan, link);
  res.status(200).json({"text": text});
})

async function getAiData(lang = "italiano", link) {
  const prompt = `fai un riassunto, in ${lang}, di massimo 600 caratteri del contenuto all'interno di questo link: '${link}'. Non evidenziare il fatto che la risposta l'hai trovata li; scrivi solo la risposta`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
}


app.get('/aitrovaq', async (req, res) => {
  lan = req.query.lan ?? "italiano";
  link = req.query.link
  q = req.query.q;
  data = await  axios.get(link)
  const textPage = cheerio.load(data).text();
  const prompt = `rispondi, in ${lan}, a "${q}" con un massimo 400 caratteri basandoti solo sul contenuto all'interno di questo link: '${link}' e di '${textPage}', considerando che in quest ultimo ci può essere del codice html. Non è necessario ci sia una risposta precisa, se la risposta, non è presente in nessun modo, fallo sapere e dai tu una risposta sempre non superando 400 caratteri.
  inoltre se c'è la risposta non evidenziare il fatto che la risposta l'hai trovata li; scrivi solo la risposta o soluzione trovata all'interno del link o del testo.
  `;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text()
  res.status(200).json({"text": text});
})

app.get('/prova', (req, res) => {
res.json({text: "prova"});
})


app.listen(80);
