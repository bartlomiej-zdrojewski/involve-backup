/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <[EMAIL]>, July 2017
 */

Invity.controller( 'ProfileController', [ '$scope', '$http', '$window', '$sce', '$mdDialog', '$mdSidenav', '$mdToast', '$mdMedia', 'server', 'navigation', 'tutorial', function ( $scope, $http, $window, $sce, $mdDialog, $mdSidenav, $mdToast, $mdMedia, server, navigation, tutorial ) {

    $scope.ActiveTab = 'portfolio';
    $scope.Details = {};
    $scope.Portfolio = {};
    $scope.Notifications = {};
    $scope.LatestNotifications = {};

    $scope.Page = 'profile';
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

    $scope.DateToShortText = function ( date ) {

        let Data = new Date ( date );
        let Result = ( Data.getMonth() + 1 ) + '.' + ( Data.getFullYear() % 100 );

        if ( Result.length != 5 ) {

            Result = '0' + Result; }

        Result = Data.getDate() + '.' + Result;

        if ( Result.length != 8 ) {

            Result = '0' + Result; }

        return Result;

        };

    $scope.DateToLongText = function ( date ) {

        let Data = new Date ( date );
        let Result = Data.getDate() + ' ';

        if ( Result.length != 3 ) {

            Result = '0' + Result; }

        switch ( Data.getMonth() ) {

            case 0:  Result = Result + 'stycznia'; break;
            case 1:  Result = Result + 'lutego'; break;
            case 2:  Result = Result + 'marca'; break;
            case 3:  Result = Result + 'kwietnia'; break;
            case 4:  Result = Result + 'maja'; break;
            case 5:  Result = Result + 'czerwca'; break;
            case 6:  Result = Result + 'lipca'; break;
            case 7:  Result = Result + 'sierpnia'; break;
            case 8:  Result = Result + 'września'; break;
            case 9:  Result = Result + 'października'; break;
            case 10: Result = Result + 'listopada'; break;
            case 11: Result = Result + 'grudnia'; break;

            }

        Result = Result + ' ' + Data.getFullYear() + ' r.';

        return Result;

        };

    $scope.LaunchAttachment = function ( attachment ) {

        $window.open( attachment.link, '_blank' );

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

        $http.get( server.api + "/" + $scope.Page ).then( // "examples/profile.json"

            function ( response ) {

                $scope.Details = response.data.details;
                $scope.Portfolio = response.data.portfolio;
                $scope.Notifications = response.data.notifications;

                $scope.Portfolio.skills.sort(

                    function ( a, b ) {

                        if ( a.level > b.level ) {

                            return -1; }

                        if ( a.level < b.level ) {

                            return 1; }

                        if ( a.title > b.title ) {

                            return 1; }

                        if ( a.title < b.title ) {

                            return -1; }

                        return 0; }

                    );

                $scope.Portfolio.attachments.sort(

                    function ( a, b ) {

                        if ( a.date > b.date ) {

                            return -1; }

                        if ( a.date < b.date ) {

                            return 1; }

                        if ( a.title > b.title ) {

                            return 1; }

                        if ( a.title < b.title ) {

                            return -1; }

                        return 0; }

                    );

                $scope.Notifications.sort(

                    function ( a, b ) {

                        if ( a.date > b.date ) {

                            return -1; }

                        if ( a.date < b.date ) {

                            return 1; }

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