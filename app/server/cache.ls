md5 	= require "MD5"
redis 	= require "redis"
request	= require "request"

client = redis.createClient()

TTL = 3600

exports.get = (key, cb) -> 
	key = "cache-#{md5(key)}"

	client.get key, cb

exports.set = (key, value) -> 
	key = "cache-#{md5(key)}"

	client.set key, value
	client.expire key, TTL

exports.request = (url, cb) ->

	(error, body) <- exports.get url
	console.log "CACHE: REDIS | url: #{url} | status: #{!!body}"

	return cb null, body if body

	(error, response, body) <- request url
	console.log "CACHE: HTTP | #{url} | status: #{!!body}"
	return cb error, null if error

	cb null, body
	exports.set url, body

