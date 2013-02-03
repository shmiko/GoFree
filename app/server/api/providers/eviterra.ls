async       = require "async"
database    = require "./../../database"
moment      = require "moment"
request     = require "request"
xml2js      = require "xml2js"
_           = require "underscore"

# Globals
parser = new xml2js.Parser(xml2js.defaults["0.1"])
moment.lang('ru')

# Providers
exports.name = "eviterra"

getEviterraId = (place, callback) ->
  return callback(null, place.eviterra_id) if place.eviterra_id

  (error, result) <- exports.autocomplete "#{place.name_ru}"
  return callback(error,              null)  if error
  return callback({'nothing found'},  null)  if result.length is 0

  eviterra_id = result[0].iata
  callback null, eviterra_id
  database.geonames.update {geoname_id : place.geoname_id}, {$set: {eviterra_id : eviterra_id}}

exports.query = (origin, destination, extra, cb) ->

  (error, eviterraId) <- async.parallel {
    origin      : (callback) -> getEviterraId origin.place,       callback
    destination : (callback) -> getEviterraId destination.place,  callback
  }

  return cb(error, null) if error

  evUrl = "http://api.eviterra.com/avia/v1/variants.xml?from=#{eviterraId.origin}&to=#{eviterraId.destination}&date1=#{origin.date}&adults=#{extra.adults}"

  (error, response, body) <- request evUrl
  console.log "Queried Eviterra serp | #{evUrl} | status #{response.statusCode}"
  return cb(error, null) if error

  (error, json) <- parser.parseString response.body
  return cb(error, null) if error

  cb null, json

exports.process = (flights, cb) -> 
  console.log "Processing Eviterra serp"

  if not flights or not flights.variant
    return cb({message: 'No flights found'}, null)

  for variant in flights.variant
    if variant.segment.flight.length?
      variant.transferNumber  = variant.segment.flight.length
      variant.firstFlight     = variant.segment.flight[0]
      variant.lastFlight      = variant.segment.flight[variant.transferNumber-1]
    
    else
      variant.transferNumber  = 1
      variant.firstFlight     = variant.segment.flight
      variant.lastFlight      = variant.firstFlight    

  allAirports   = []
  for variant in flights.variant
    allAirports.push variant.firstFlight.departure
    allAirports.push variant.lastFlight.arrival

  allAirports = _.uniq(allAirports)

  (err, airportsInfo) <- database.airports.find({iata:{$in:allAirports}}).toArray()
  newFlights = []

  for variant in flights.variant
    
    arrivalDestinationDate  = moment variant.lastFlight.arrivalDate     + 'T' + variant.lastFlight.arrivalTime
    departureOriginDate     = moment variant.firstFlight.departureDate  + 'T' + variant.firstFlight.departureTime

    departureAirport        = _.filter(airportsInfo, (el) -> el.iata is variant.firstFlight.departure)[0]
    arrivalAirport          = _.filter(airportsInfo, (el) -> el.iata is variant.lastFlight.arrival)[0]

    if not(departureAirport and arrivalAirport)
      return cb {message: "No airport found | departure: #{departureAirport} | arrival: #{arrivalAirport}"}, null

    # UTC massage
    utcArrivalDate          = arrivalDestinationDate.clone().subtract 'hours', arrivalAirport.timezone  
    utcDepartureDate        = departureOriginDate.clone().subtract    'hours', departureAirport.timezone

    flightTimeSpan          = utcArrivalDate.diff utcDepartureDate,   'hours'
    flightTimeSpan          = 1 if (flightTimeSpan is 0)

    newFlight = 
      price     : parseInt variant.price
      
      arrival   : arrivalDestinationDate.format "hh:mm"#\LL
      departure : departureOriginDate.format "hh:mm"#\LL
      duration  : flightTimeSpan * 60 * 60
      stops     : variant.transferNumber - 1
      
      url       : variant.url + \ostroterra
      provider  : \eviterra

    newFlights.push newFlight

  cb null, {
    results: newFlights,
    complete: true
  }

exports.search = (origin, destination, extra, cb) ->
  (error, json)     <- exports.query origin, destination, extra
  return cb(error, null) if error
  
  (error, results)  <- exports.process json
  return cb(error, null) if error

  cb null, results

exports.autocomplete = (query, callback) ->
  eviterraUrl = "https://eviterra.com/complete.json?val=#{query}"
  (error, response, body) <-! request eviterraUrl
  console.log "Queried eviterra autocomplete | #{eviterraUrl} | error: #{error} | status: #{response?.statusCode}"
  return callback(error, null) if error

  json = JSON.parse(response.body)  
  finalJson = []
  
  for item in json.data when item.type is 'city'
    name        = item.name
    country     = item.area
    iata        = item.iata
    displayName = name

    if country isnt "Россия"
      displayName += ", #{country}"

    finalJson.push {
      name:         name
      iata:         iata
      country:      country
      displayName:  displayName
      provider:     exports.name
    }

  callback null, finalJson
