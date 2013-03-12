(function(){
  var auth, autocomplete, geoip, image, socket, hotels;
  auth = require("./auth");
  autocomplete = require("./autocomplete");
  geoip = require("./geoip");
  image = require("./image");
  socket = require("./socket");
  hotels = require("./hotels");
  exports.autocomplete_v2 = autocomplete.autocomplete;
  exports.image_v2 = image.image_v2;
  exports.add_email = auth.add_email;
  exports.get_location = geoip.get_location;
  exports.search = socket.search;
  exports.hotels = hotels;
}).call(this);
