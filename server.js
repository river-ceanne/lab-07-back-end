'use strict';

require('dotenv').config();

//required libaries
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
// const pg = require('pg');

// const client = new pg.Client('http://postgres...blablabla/city-explorer');
// client.connect();
//inside the repo - create a schema.sql file which creates the table for
// locations (latitiude DECIMAL, longitude DECIMAL, search_query and
// formatted_query as VARCHAR(255)) etc.....

//commands: heroku pg:psql < schema.sql

const app = express();

//PORT for the sever to operate
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.static('./public'));
//checking to see if the servre is working
app.get('/', (request, response) => {
  response.send('server works');
});


// **********CONSTRUCTOR FUNCS*******************//
//constructor for Location
function GEOloc(query, fmtQ, lat, long) {
  this.search_query = query;
  this.formatted_query = fmtQ;
  this.latitude = lat;
  this.longitude = long;
}
//constructor for weather
function Forecast(forecast, time) {
  this.forecast = forecast;
  this.time = time;
}
//constructor for events
function Event(link, name, event_date, summary) {
  this.link = link;
  this.name = name;
  this.event_date = event_date;
  this.summary = summary;
}

// **************FUNCTIONS*********************//
//Error Handler
function handleError() {
  return { 'status': 500, 'responseText': 'Sorry, something went wrong' };
}
//Global Location Variable
let city;
//location
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
      response.send(handleError());
    }
  });
});

//Weather
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

//EventBrite
app.get('/events', (request, response) => {
  try {
    let geoCodeURL = `https://www.eventbriteapi.com/v3/events/search?location.longitude=${city.longitude}&location.latitude=${city.latitude}&expand=venue`;

    superagent.get(geoCodeURL).set('Authorization', `Bearer ${process.env.EVENTBRITE_API_KEY}`)
      .end((err, googleAPIresponse) => {
        let events = googleAPIresponse.body.events;
        let resultEvents = events.map(value => {
          let name = value.name.text;
          let link = value.url;
          let eventDate = new Date(value.start.local).toDateString();
          let summary = value.summary;
          return new Event(link, name, eventDate, summary);
        });
        console.log(resultEvents);
        response.send(resultEvents);
      });
  }
  catch (error) {
    response.send(error);
  }
});
//Handling all the paths
app.use('*', (request, response) => response.send('Sorry, that route does not exist.'))
//Listening to the port
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
