/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'RecoveryController', [ '$scope', '$window', '$location', '$http', '$mdDialog', 'server', function ( $scope, $window, $location, $http, $mdDialog, server ) {

    $scope.Password = '';
    $scope.PasswordRepeat = '';

    $scope.local = server.local;

    $scope.Close = function ( ) {

        $window.close();

        };

    $scope.Recover = function ( ) {

        $http.post( server.url + server.api + "/change_password", {

            token: $scope.Token,
            password: $scope.Password

            } ).then(

                function ( response ) {

                    $mdDialog.show(

                        $mdDialog.alert ( )

                            .title( 'Zakończono proces odzyskiwania konta' )
                            .textContent( response.data )
                            .ariaLabel( 'Twoje hasło zostało zaktualizowane. Możesz się teraz zalogować.' )
                            .ok( 'Super!' )
                            .parent( angular.element( document.body ) )
                            .targetEvent( null )
                            .clickOutsideToClose( true )

                            ).finally(

                                function ( ) {

                                    $window.location.href = server.url;

                                    }

                                );

                    },

                function ( response ) {

                    $mdDialog.show(

                        $mdDialog.alert ( )

                            .title( 'Podczas zmiany hasła wystąpił błąd' )
                            .textContent( response.data )
                            .ariaLabel( 'Podczas zmiany hasła wystąpił błąd' )
                            .ok( 'Rozumiem' )
                            .parent( angular.element( document.body ) )
                            .targetEvent( null )
                            .clickOutsideToClose( true )

                        );

                    }

                );

        };

    $scope.Setup = function ( ) {

        $scope.Token = $location.search().token;

        $http.get( server.url + server.api + "/validate_token?token=" + $scope.Token ).then(

            function ( response ) {

                // NOTHING

                },

            function ( response ) {

                $mdDialog.show(

                    $mdDialog.alert ( )

                        .title( 'Podczas weryfikacji konta wystąpił błąd' )
                        .textContent( response.data )
                        .ariaLabel( 'Podczas weryfikacji konta wystąpił błąd' )
                        .ok( 'Rozumiem' )
                        .parent( angular.element( document.body ) )
                        .targetEvent( null )
                        .clickOutsideToClose( true )

                        ).finally(

                            function ( ) {

                                $window.close();

                                }

                            );

                }

            );

        }

    } ] );