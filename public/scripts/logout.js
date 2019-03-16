/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'LogoutController', [ '$scope', '$window', '$http', '$mdDialog', 'server', function ( $scope, $window, $http, $mdDialog, server ) {

    $scope.local = server.local;

    $scope.Setup = function ( ) {

        $http.get( server.url + server.api + "/logout" ).then(

            function ( response ) {

                $window.location.href = server.url;
                
                },

            function ( response ) {
                
                console.log( "ERROR #" + response.status + " IN SETUP: " + response.data );

                $window.location.href = server.url;

                }
                
            );

        };

    } ] );