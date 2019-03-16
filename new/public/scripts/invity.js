/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <[EMAIL]>, July 2017
 */

let Invity = angular.module( 'Invity', [ 'ngMaterial', 'ngMessages', 'ngAnimate', 'ngSanitize' ] );

Invity.config( function( $locationProvider ) {

    $locationProvider.html5Mode( {

        enabled: true,
        requireBase: false

        } );

    } );

Invity.constant( 'server', { api: "/api", strict: false, tutorial: false } );

Invity.service( 'navigation', [ '$http', '$mdToast', 'server', function ( $http, $mdToast, server ) {

    this.GetNavigation = function ( page, callback ) {

        $http.get( "navigation.json" ).then(

            function ( response ) {

                let Navigation = response.data;

                for ( let i = 0; i < Navigation.length; i++ ) {

                    Navigation[i].active = Navigation[i].page === page; }

                callback( Navigation );

                },

            function ( response ) {

                console.log( "ERROR #" + response.status + " IN GET_NAVIGATION: " + response.data );

                $mdToast.show(

                    $mdToast.simple()
                        .textContent( 'Podczas wczytywania nawigacji wystąpił błąd!' )
                        .position( 'top left' )
                        .hideDelay( 5000 )

                    );

                }

            );

        };

    } ] );

Invity.service( 'tutorial', [ '$http', '$window', '$sce', '$mdToast', 'server', function ( $http, $window, $sce, $mdToast, server ) {

    this.GetTutorial = function ( page, show, callback ) {

        if ( !server.tutorial || !show ) {

            return; }

        $http.get( "tutorials/" + page + ".json" ).then(

            function ( response ) {

                let Tutorial = {};

                Tutorial.step = 0;
                Tutorial.state = {};
                Tutorial.data = response.data;
                Tutorial.length = response.data.length;

                Tutorial.data.sort(

                    function ( a, b ) {

                        if ( a.step > b.step ) {

                            return 1; }

                        if ( a.step < b.step ) {

                            return -1; }

                        return 0; }

                    );

                Tutorial.Enter = function ( ) {

                    $http.get( server.url + server.api + "/tutorial?value=true" ).then(

                        function ( ) {

                            $window.location.reload();

                            },

                        function ( response ) {

                            console.log( "ERROR #" + response.status + " IN ENTER_TUTORIAL: " + response.data );

                            $mdToast.show(

                                $mdToast.simple()
                                    .textContent( 'Podczas otwierania samouczka wystąpił błąd! Spróbuj ponownie.' )
                                    .position( 'top left' )
                                    .hideDelay( 5000 )

                                );

                            }

                        );

                    };

                Tutorial.Continue = function ( ) {

                    this.step++;

                    this.state = angular.copy( this.data[ this.step - 1 ] );
                    this.state.text = $sce.trustAsHtml( this.state.text );

                    };

                Tutorial.Leave = function ( ) {

                    this.step = 0;

                    $http.get( server.url + server.api + "/tutorial?value=false" ).then(

                        function ( ) {

                            $window.location.reload();

                            },

                        function ( response ) {

                            console.log( "ERROR #" + response.status + " IN LEAVE_TUTORIAL: " + response.data );

                            $mdToast.show(

                                $mdToast.simple()
                                    .textContent( 'Podczas zamykania samouczka wystąpił błąd!' )
                                    .position( 'top left' )
                                    .hideDelay( 5000 )

                                );

                            }

                        );

                    };

                callback( Tutorial );

                },

            function ( response ) {

                console.log( "ERROR #" + response.status + " IN GET_TUTORIAL: " + response.data );

                $mdToast.show(

                    $mdToast.simple()
                        .textContent( 'Podczas wczytywania samouczka wystąpił błąd!' )
                        .position( 'top left' )
                        .hideDelay( 5000 )

                    );

                }

            );

        };

    } ] );