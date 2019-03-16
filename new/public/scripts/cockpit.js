/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <[EMAIL]>, July 2017
 */

Invity.controller( 'CockpitController', [ '$scope', '$http', '$window', '$sce', '$mdDialog', '$mdSidenav', '$mdToast', '$mdMedia', 'server', 'navigation', 'tutorial', function ( $scope, $http, $window, $sce, $mdDialog, $mdSidenav, $mdToast, $mdMedia, server, navigation, tutorial ) {

    $scope.ActiveTab = {

        FirstFrame: 'suggested',
        SecondFrame: 'suggested',
        ThirdFrame: 'suggested'

        };

    $scope.Projects = {};
    $scope.Cases = {};
    $scope.Notifications = {};
    $scope.LatestNotifications = {};

    $scope.Page = 'cockpit';
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

    $scope.LaunchNotification = function ( notification ) {

        $http.get( server.api + "/notification?hash=" + notification.hash ).then(

            function ( response ) {

                $window.location.href = notification.link;

                },

            function ( response ) {

                console.log( "ERROR #" + response.status + " IN LAUNCH_NOTIFICATION: " + response.data );

                $window.location.href = notification.link;

                }

            );

        };

    $scope.Setup = function ( ) {

        // CODE

        navigation.GetNavigation( $scope.Page, function ( Navigation ) {

            $scope.Navigation = Navigation;

            } );

        $http.get( "examples/cockpit.json" ).then( // server.api + "/" + $scope.Page

            function ( response ) {

                $scope.Projects = response.data.projects;
                $scope.Cases = response.data.cases;
                $scope.Notifications = response.data.notifications;

                $scope.Projects.assigned.sort(

                    function ( a, b ) {

                        if ( a.finished && !b.finished ) {

                            return 1; }

                        if ( !a.finished && b.finished ) {

                            return -1; }

                        if ( a.finished && b.finished && a.success && !b.success ) {

                            return -1; }

                        if ( a.finished && b.finished && !a.success && b.success ) {

                            return 1; }

                        if ( a.leader && !b.leader ) {

                            return -1; }

                        if ( !a.leader && b.leader ) {

                            return -1; }

                        if ( a.title > b.title ) {

                            return 1; }

                        if ( a.title < b.title ) {

                            return -1; }

                        return 0; }

                    );

                $scope.LatestNotifications = $scope.Notifications.slice( 0, 10 );

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