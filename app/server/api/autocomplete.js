(function(){
  var geobase;
  geobase = require("./../geobase");
  exports.autocomplete = function(req, res){
    var query;
    query = req.params.query;
    if (!query) {
      res.json({
        status: 'error',
        message: "Please supply 'q' GET param."
      });
    }
    return geobase.autocomplete(query, function(error, results){
      if (error) {
        return res.json({
          status: 'error',
          error: error
        });
      }
      return res.json({
        status: 'ok',
        value: results
      });
    });
  };
}).call(this);
