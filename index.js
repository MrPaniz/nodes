const express = require('express');
require('dotenv').config();
const apiKey = process.env.API_KEY 
const app = express(); 
const cors = require('cors');
app.use(cors())
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

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

//loop (5 sec) 
const makeRequest = async () => {
    try {
      await axios.get('https://estensione.onrender.com/prova');
        console.log('GET request to localhost successful');
    } catch (error) {
      console.error('Error making GET request:', error.message);
    }
  };
//
  //const interval = setInterval(makeRequest, 5000);
//

