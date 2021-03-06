// Generated by CoffeeScript 1.4.0
var Mongolian, airports, csv, db, objects, server;

String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g, "");
};

csv = require("csv");

Mongolian = require("mongolian");

server = new Mongolian();

db = server.db("ostroterra");

airports = db.collection("airports");

objects = [];

csv().from.path("airports.csv", {
  delimiter: ",",
  columns: null
}).transform(function(data) {
  data.unshift(data.pop());
  return data;
}).on("record", function(data, index) {
  var airportId, alt, city, country, iata, icao, lat, lon, name, timezone;
  airportId = data[1].trim();
  name = data[2].trim();
  city = data[3].trim();
  country = data[4].trim();
  iata = data[5].trim();
  icao = data[6].trim();
  lat = data[7].trim();
  lon = data[8].trim();
  alt = data[9].trim();
  timezone = data[10].trim();
  if (iata) {
    return objects.push({
      airportId: airportId,
      name: name,
      city: city,
      country: country,
      iata: iata,
      icao: icao,
      lat: lat,
      lon: lon,
      alt: alt,
      timezone: timezone
    });
  }
}).on("end", function(count) {
  console.log(">> Airports drop");
  airports.drop();
  console.log(">> Airports insert");
  airports.insert(objects);
  return console.log(">> END");
});
