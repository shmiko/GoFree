(function(){
  var _, async, database, S, rome2rio, getNeareastAirport;
  _ = require("underscore");
  async = require("async");
  database = require("./database");
  S = require("string");
  rome2rio = require("./api/providers/rome2rio");
  exports.extend_geoname = function(geoname, params){
    var i$, ref$, len$, i, name_ru_lower;
    if (params != null && params.regexp_query) {
      for (i$ = 0, len$ = (ref$ = geoname.name_ru_lower_collection).length; i$ < len$; ++i$) {
        i = i$;
        name_ru_lower = ref$[i$];
        if (name_ru_lower.match(params.regexp_query)) {
          geoname.name_ru_lower = name_ru_lower;
          geoname.name_ru = geoname.name_ru_collection[i];
          geoname.name_ru_inflected = geoname.name_ru_inflected_collection[i];
        }
      }
    }
    if (!geoname.name_ru) {
      geoname.name_ru = geoname.name_ru_collection[0];
    }
    if (!geoname.name_ru_inflected) {
      geoname.name_ru_inflected = geoname.name_ru_inflected_collection[0];
    }
    if (!geoname.name_ru_lower) {
      geoname.name_ru_lower = geoname.name_ru_lower_collection[0];
    }
    delete geoname._id;
    delete geoname.name_ru_collection;
    delete geoname.name_ru_inflected_collection;
    delete geoname.name_ru_lower_collection;
    return geoname;
  };
  exports.autocomplete = function(query, callback){
    var regexp_query;
    query = S(query).toLowerCase().replaceAll('-', '_').replaceAll(' ', '_').s;
    regexp_query = new RegExp("^" + query);
    return database.geonames.find({
      $or: [
        {
          name_lower: regexp_query
        }, {
          name_ru_lower_collection: regexp_query
        }
      ],
      population: {
        $gte: 10000
      },
      name_ru_collection: {
        $ne: []
      }
    }).limit(10).sort({
      population: -1
    }).toArray(function(error, results){
      if (error) {
        return callback(error, null);
      }
      results = _.map(results, function(r){
        return exports.extend_geoname(r, {
          regexp_query: regexp_query
        });
      });
      return callback(null, results);
    });
  };
  getNeareastAirport = function(origin, destination, cb){
    return rome2rio.getNeareasAirport(origin, destination, function(error, iata){
      if (error) {
        return cb(error, null);
      }
      return async.parallel({
        geoname: function(callback){
          return database.geonames.findOne({
            iata: iata
          }, callback);
        },
        airport: function(callback){
          return database.airports.findOne({
            iata: iata
          }, callback);
        }
      }, function(error, result){
        if (error) {
          return cb(error, null);
        }
        if (result.geoname) {
          return cb(null, exports.extend_geoname(result.geoname));
        } else if (result.airport) {
          return database.geonames.findOne({
            country_name: result.airport.country,
            name: result.airport.city
          }, function(error, geoname){
            if (error) {
              return cb(error, null);
            }
            return cb(null, exports.extend_geoname(geoname));
          });
        } else {
          return cb({
            message: 'nothing found'
          }, null);
        }
      });
    });
  };
  exports.findRoute = function(origin, destination, cb){
    var originAirport, destinationAirport, operations;
    originAirport = origin.iata ? origin : null;
    destinationAirport = destination.iata ? destination : null;
    if (originAirport && destinationAirport) {
      return cb(null, {
        destinationAirport: destinationAirport,
        originAirport: originAirport
      });
    }
    operations = {};
    operations.originAirport = function(callback){
      if (!originAirport) {
        return getNeareastAirport(destination, origin, function(error, airport){
          return callback(error, airport || origin);
        });
      } else {
        return callback(null, originAirport);
      }
    };
    operations.destinationAirport = function(callback){
      if (!destinationAirport) {
        return getNeareastAirport(origin, destination, function(error, airport){
          return callback(error, airport || destination);
        });
      } else {
        return callback(null, destinationAirport);
      }
    };
    return async.parallel(operations, function(error, results){
      return cb(null, results);
    });
  };
}).call(this);
