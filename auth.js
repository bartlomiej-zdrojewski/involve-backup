/* Copyright (C) Brian Camacho and Zuzanna Opała - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Brian Camacho <brian.camacho@invity.space> and Zuzanna Opała <zuzanna.opala@invity.space>, July 2017
 */

var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy
    , FacebookStrategy = require('passport-facebook').Strategy;

var db = require('./db');
var crypto = require('crypto');

passport.use(new LocalStrategy(
    
    {   usernameField: 'email',
        passwordField: 'password' },
    
    function(email, password, done) {
        db.GetUserByEmail(email, function(err, result) {
            if(err) return done(err);
            else if(result === null) return done(new Error('Nie  ma takiego uzytkownika'), 400);
                if(result == undefined) return done(new Error('Internal server error'), 500);
                
            else {
                var hashedAttempt = EncryptWithSalt(password, result.salt);
                if(hashedAttempt === result.authHash) return done(null, result);
                else return done(new Error('Błędne hasło'), 401);
            }
    })}

));
passport.use(new FacebookStrategy({
        clientID: 308160696212448,
        clientSecret: process.env.FACEBOOK_SECRET,
        callbackURL: process.env.LOCAL_URL + "/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        if(profile == null) return done(new Error('Missing profile'));
        db.FindByFacebookId(profile.id, function (err, result) {
            if(err) {
                return done(err.message)
            }
            if(result == null) {
                db.AddUserByFacebookProfile(profile, function (err, result) {
                    if(err) return done(err);
                    done(null, result)
                })
            }
            else{
                done(null, result)
            }
        })
    }
));
passport.serializeUser(function(user, done) {
        done(null, user._id);
});

passport.deserializeUser(function(_id, done) {
    db.GetUser(_id, function(err, user) {
        done(err, user);
    });
});
function EncryptWithSalt (password, salt) {
    return crypto.createHash('sha256').update(password + salt).digest('hex');
}

module.exports = passport;