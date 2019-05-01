'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

const app = express();

const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.static('./public'));

app.get('/', (request, response) => {
  response.send('server works');
});

function GEOloc(query, fmtQ, lat, long) {
  this.search_query = query;
  this.formatted_query = fmtQ;
  this.latitude = lat;
  this.longitude = long;
}

function Forecast(forecast, time) {
  this.forecast = forecast;
  this.time = time;
}

function handleError() {
  return { 'status': 500, 'responseText': 'Sorry, something went wrong' };
}

let city;

app.get('/location', (request, response) => {
  let queryData = request.query.data;

  let geoCodeURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${queryData}&key=${process.env.GOOGLE_API}`;
  superagent.get(geoCodeURL).end((err, googleAPIresponse) => {
    console.log(googleAPIresponse.body);
    let data = googleAPIresponse.body;
    console.log(data);
    city = new GEOloc(queryData, data.results[0].formatted_address, data.results[0].geometry.location.lat, data.results[0].geometry.location.lng);
    response.send(city);

    if (err) {
      handleError();
    }

  });

});


app.get('/weather', (request, response) => {

  try {
    let geoCodeURL = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${city.latitude},${city.longitude}`;
    superagent.get(geoCodeURL).end((err, googleAPIresponse) => {
      console.log('WEATHER: ', googleAPIresponse.body);
      let data = googleAPIresponse.body;
      console.log(data);

      let daily = Object.entries(data)[6];
      console.log(daily);
      let dailyData = daily[1].data;//hourly day forecast

      let myForecast = dailyData.map(element => {
        let date = new Date(element.time * 1000).toDateString();
        return new Forecast(element.summary, date);
      });
      response.send(myForecast);

    });

  } catch (error) {
    response.send(error);
  }

});


app.use('*', (request, response) => response.send('Sorry, that route does not exist.'))

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
