/* Copyright (C) Brian Camacho and Zuzanna Opała - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Brian Camacho <brian.camacho@invity.space> and Zuzanna Opała <zuzanna.opala@invity.space>, July 2017
 */

const https = require("https");
const qs = require("querystring");
require('dotenv').load();
/**
 * Retrieve geo-coordinates from a name of a city
 * @param cityName: name of the city
 * @param key: google API key (from .env)
 * @param callback function (err, lat, lng) : callback to pass the results JSON object(s) back
 */

//https://www.mapquestapi.com/geocoding/v1/address?key=KEY&inFormat=kvp&outFormat=json&location=Torun%2C+Poland&thumbMaps=false

module.exports.geocodeIntoJSON = function(cityName, key, callback) {
    const httpOptions = {
        host: 'www.mapquestapi.com',
        port: 443,
        path: '/geocoding/v1/address' + '?' + qs.stringify({
            "location":cityName + ", Poland",
            "key":key,
            "outFormat": "json",
            "thumbMaps": false,
            "inFormat": "kvp"
        }),
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    console.log(httpOptions);

    let req = https.request(httpOptions, function(res) {
        let output = '';
        res.setEncoding('utf8');
    
        res.on('data', function (chunk) {
            output += chunk;
        });
    
        res.on('end', function() {
            const obj = JSON.parse(output);
            if(obj.results === undefined) callback('API query failed, key could be invalid', null, null);
            if(obj.results.length === 0) callback('Geocoding failed', null, null);
            else callback(null, obj.results[0].locations[0].latLng.lat, obj.results[0].locations[0].latLng.lng);
            
        });
    });

    req.on('error', function(err) {
        callback(new Error('Error reading response data', null, null))
    });

    req.end();
};

//Example query
// module.exports.geocodeIntoJSON('Torun', process.env.NOMINATIM_KEY, function (err, lat, lng) {
//     console.log(process.env.NOMINATIM_KEY)
//     err ? console.log(err) : console.log(lat + ' ' + lng);
// })