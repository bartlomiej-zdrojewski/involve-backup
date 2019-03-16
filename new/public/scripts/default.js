/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <[EMAIL]>, July 2017
 */

Invity.controller( 'DefaultController', [ '$scope', '$http', '$window', '$sce', '$mdDialog', '$mdSidenav', '$mdToast', '$mdMedia', 'server', 'navigation', 'tutorial', function ( $scope, $http, $window, $sce, $mdDialog, $mdSidenav, $mdToast, $mdMedia, server, navigation, tutorial ) {

    // CODE

    $scope.Page = 'default';
    $scope.Navigation = {};
    $scope.Tutorial = {};
    $scope.$mdMedia = $mdMedia;

    $scope.Redirect = function ( url ) {

        $window.location.href = url;

        };

    $scope.OpenNavigation = function ( ) {

        $mdSidenav('navigation').open();

        };

    $scope.CloseNavigation = function ( ) {

        $mdSidenav('navigation').close();

        };

    // CODE

    $scope.Setup = function ( ) {

        // CODE

        navigation.GetNavigation( $scope.Page, function ( Navigation ) {

            $scope.Navigation = Navigation;

            } );

        $http.get( server.api + "/" + $scope.Page ).then(

            function ( response ) {

                // CODE

                tutorial.GetTutorial( $scope.Page, $mdMedia('gt-sm') && response.data.tutorial, function ( Tutorial ) {

                    $scope.Tutorial = Tutorial;
                    $scope.Tutorial.Continue();

                    } );

                },

            function ( response ) {

                console.log( "ERROR #" + response.status + " IN SETUP: " + response.data );

                if ( !server.strict ) {

                    return; }

                $mdDialog.show(

                    $mdDialog.confirm ( )

                        .title( 'Błąd sieci #' + response.status )
                        .textContent( 'Spróbuj odświeżyć stronę. Jeśli nie rozwiąże to problemu, zakończ sesję i zaloguj się ponownie.' )
                        .ariaLabel( 'Błąd wczytywania danych' )
                        .ok( 'Odśwież' )
                        .cancel( 'Zakończ' )
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