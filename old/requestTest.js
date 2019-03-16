const request = require('request');
const fs = require('fs');

request({
                uri: 'https://graph.facebook.com/v2.8/' + '1158756644205773' + '/picture?type=large'
        },
        function (error, response, body) {
            if(error) return console.log(error);
            console.log('Graph api responded with: ' + response.statusCode);
            console.log(response.request.uri.pathname);
            request({
                        uri: response.location
            }, function (err, res, body) {
                console.log(res);
            });
        });