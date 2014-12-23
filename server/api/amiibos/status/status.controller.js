'use strict';

var _ = require('lodash');
var validator = require('validator');
var async = require('async');
var availability = require('../../../components/availability');
var amiibos = require('../../../components/amiibos');

// Get status of an amiibo
exports.index = function(req, res) {
  var name = req.param('name');
  var zip = req.param('zip');
  // In miles
  var radius = req.param('radius');
  var region = req.param('region');
  if(validator.isNull(name)) {
    return res.status(400).jsonp({message: 'Missing Amiibo name.', names: Object.keys(amiibos)});
  }
  if(validator.isNull(zip)) {
    return res.status(400).jsonp({message: 'Missing zipcode.'});
  }
  if(validator.isNull(radius)) {
    radius = 10;
  }
  if(validator.isNull(region)) {
    region = 'us';
  }
  if(!validator.isName(name)) {
    return res.status(400).jsonp({message: 'Invalid Amiibo name.', names: Object.keys(amiibos)})
  }
  if(!validator.isZipcode(zip, 'US')) {
    return res.status(400).jsonp({message: 'Invalid zipcode, must be 5 digits and a US zipcode.'});
  }
  var amiibo = amiibos[name];
  var storeNames = Object.keys(amiibo).filter(function (n) {
    return n !== 'productCode';
  });
  var amiiboResp = {};
  async.eachSeries(storeNames, function (store, callback) {
    if(store === 'walmart') {
      availability.walmart(amiibo[store], function (error, walmartData) {
        if(error) {
          console.log(error);
          return callback('Could not get status of Walmart data.');
        }
        amiiboResp['walmart'] = walmartData;
        return callback();
      });
    } else if(store === 'bestbuy') {
      availability.bestbuy(amiibo[store], zip, radius, function (error, bestbuyData) {
        if(error) {
          console.log(error);
          return callback('Could not get status of Bestbuy data.');
        }
        amiiboResp['bestbuy'] = bestbuyData;
        return callback();
      });
    } else if(store === 'gamestop') {
      availability.gamestop(amiibo[store], zip, function (error, gamestopData) {
        if(error) {
          console.log(error);
          return callback('Could not get status of Gamestop data.');
        }
        amiiboResp['gamestop'] = gamestopData;
        return callback();
      });
    } else if(store === 'toysrus') {
      availability.toysrus(amiibo[store], zip, radius, function (error, toysrusData) {
        if(error) {
          console.log(error);
          return callback('Could not get status of Toys-R-Us data.');
        }
        amiiboResp['toysrus'] = toysrusData;
        return callback();
      });
    } else if(store === 'target') {
      availability.target(amiibo[store], zip, radius, function (error, targetData) {
        if(error) {
          console.log(error);
          return callback('Could not get status of Target data.');
        }
        amiiboResp['target'] = targetData;
        return callback();
      });
    } else if(store === 'amazon') {
      availability.amazon(amiibo[store], zip, radius, function (error, amazonData) {
        if(error) {
          console.log(error);
          return callback('Could not get status of Amazon data.');
        }
        amiiboResp['amazon'] = amazonData;
        return callback();
      });
    } else {
      return callback();
    }
  }, function (error) {
    if(error) {
      return res.status(500).jsonp({message: error});
    }
    return res.jsonp(amiiboResp);
  });
};

validator.extend('isName', function (str) {
  var amiiboNames = Object.keys(amiibos);
  if(amiiboNames.indexOf(str) !== -1) {
    return true;
  }
  return false;
});

validator.extend('isZipcode', function (str, type) {
  switch(type) {
    case 'US':
    var usRegex = new RegExp(/^\d{5}$/);
    return usRegex.test(str);
    default:
    return false;
  }
});