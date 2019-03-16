/* Copyright (C) Brian Camacho and Zuzanna Opała - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Brian Camacho <brian.camacho@invity.space> and Zuzanna Opała <zuzanna.opala@invity.space>, July 2017
 */

var im = require('imagemagick');
var ModImg = {};
ModImg.ResizeProfilePic = function (filepath, done) {
    im.crop({
        srcPath: filepath,
        dstPath: filepath,
        width:   256,
        height: 256,
        gravity: 'Center',
        quality: 10
    }, function(err){
        done(err);
    });
};

module.exports = ModImg;