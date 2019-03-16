/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'PolicyController', [ '$scope', '$window', '$http', '$sce', '$mdDialog', 'server', function ( $scope, $window, $http, $sce, $mdDialog, server ) {

    $scope.Policy = "";

    $scope.local = server.local;

    $scope.Close = function ( ) {

        $window.close();

        };

    $scope.Setup = function ( ) {

        $http.get( server.url + "policy.txt" ).then(

            function ( response ) {

                $scope.Policy = $sce.trustAsHtml( response.data );

                },

            function ( response ) {

                console.log( "ERROR #" + response.status + " IN SETUP: " + response.data );

                $mdDialog.show(
                                    
                    $mdDialog.confirm ( )
                                        
                        .title( 'Błąd sieci #' + response.status )
                        .textContent( 'Spróbuj odświeżyć stronę. Jeśli nie rozwiąże to problemu, zamknij ją i otwórz ponownie za kilka minut.' )
                        .ariaLabel( 'Błąd wczytywania danych' )
                        .ok( 'Odśwież' )
                        .cancel( 'Zamknij' )
                        .parent( angular.element( document.body ) )
                        .targetEvent( null )
                        .clickOutsideToClose( true )

                        ).then(

                            function ( ) {

                                $window.location.reload();

                                },

                            function ( ) {

                                $window.location.href = server.url;

                                }

                            );

                }

            );
        
        };

    } ] );