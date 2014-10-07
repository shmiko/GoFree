// Generated by LiveScript 1.2.0
(function(){
  var _, cache, querystring;
  _ = require("underscore");
  cache = require("./../../cache");
  querystring = require("querystring");
  exports.getNeareasAirport = function(origin, destniation, cb){
    var params, r2rUrl;
    params = {
      key: 'YK8wH2AY',
      oName: origin.name + ", " + origin.country_name,
      dName: destniation.name + ", " + destniation.country_name
    };
    r2rUrl = "http://evaluate.rome2rio.com/api/1.2/json/Search?" + querystring.stringify(params);
    return cache.request(r2rUrl, function(error, body){
      var json, routes, i$, len$, route, flightStops;
      if (error) {
        return cb(error, null);
      }
      try {
        json = JSON.parse(body);
      } catch (e$) {
        error = e$;
        return cb({
          message: error
        }, null);
      }
      routes = json.routes;
      if (routes.length === 0) {
        return cb({
          message: 'no routes dound'
        }, null);
      }
      for (i$ = 0, len$ = routes.length; i$ < len$; ++i$) {
        route = routes[i$];
        flightStops = _.filter(route.stops, fn$);
        if (flightStops.length) {
          return cb(null, flightStops[flightStops.length - 1].code);
        }
      }
      return cb({
        message: 'no airports in the route'
      }, null);
      function fn$(stop){
        return stop.kind === 'airport';
      }
    });
  };
}).call(this);