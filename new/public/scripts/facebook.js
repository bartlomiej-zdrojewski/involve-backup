/* Copyright (C) Brian Camacho - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Brian Camacho <[EMAIL]>, July 2017
 */

(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

window.fbAsyncInit = function() {
    FB.init({
        appId      : '308160696212448',
        xfbml      : true,
        version    : 'v2.7'
    });
};


FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
});

function statusChangeCallback(response) {
    console.log('statusChangeCallback');
    console.log(response);
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {

        console.log('FB status connected')

    } else if (response.status === 'not_authorized') {
        // The person is logged into Facebook, but not your app.
        alert('Nastapilo wylogowanie, zaloguj sie ponownie')
    } else {
        // The person is not logged into Facebook, so we're not sure if
        // they are logged into this app or not.
        alert('Nastapilo wylogowanie, zaloguj sie ponownie')
    }
}

// This function is called when someone finishes with the Login
// Button.  See the onlogin handler attached to it in the sample
// code below.
function checkLoginState() {
    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });
}
