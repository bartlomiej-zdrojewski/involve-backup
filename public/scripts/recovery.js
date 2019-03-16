/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'RecoveryController', [ '$scope', '$window', '$location', '$http', '$mdDialog', 'server', function ( $scope, $window, $location, $http, $mdDialog, server ) {
    
    $scope.Email = "";

    $scope.local = server.local;

    $scope.Close = function ( ) {

        $window.close();

        };

    $scope.Recover = function ( ) {

        $http.get( server.url + server.api + "/recovery?email=" + $scope.Email ).then(

            function ( response ) {

                $mdDialog.show(
                                    
                    $mdDialog.alert ( )
                                        
                        .title( 'Rozpoczęto proces odzyskiwania konta' )
                        .textContent( 'Na podany przez ciebie adres e-mail został przesłany link resetujący hasło.' )
                        .ariaLabel( 'Rozpoczęto proces odzyskiwania konta' )
                        .ok( 'Super!' )
                        .parent( angular.element( document.body ) )
                        .targetEvent( null )
                        .clickOutsideToClose( true )

                        ).finally(
                            
                            function ( ) {

                                $window.close();

                                }

                            );

                },

            function ( response ) {

                $mdDialog.show(
                                    
                    $mdDialog.alert ( )
                                        
                        .title( 'Podczas odzyskiwania konta wystąpił błąd' )
                        .textContent( response.data )
                        .ariaLabel( 'Podczas odzyskiwania konta wystąpił błąd' )
                        .ok( 'Rozumiem' )
                        .parent( angular.element( document.body ) )
                        .targetEvent( null )
                        .clickOutsideToClose( true )

                        );

                }

            );

        };

    } ] );