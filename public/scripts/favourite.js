/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'FavouriteController', [ '$scope', '$window', '$http', '$interval', '$sce', '$mdDialog', '$mdToast', 'server', function ( $scope, $window, $http, $interval, $sce, $mdDialog, $mdToast, server ) {
    
    $scope.SearchPhrase = "";
    $scope.Tutorial = {};
    $scope.TutorialData = {};
    $scope.TutorialLength = 0;
    $scope.TutorialState = 0;
    $scope.NotificationsState = 0;

    $scope.FilterA = true;
    $scope.FilterB = true;
    $scope.FilterC = true;
    $scope.FilterD = true;
    $scope.FilterE = true;
    $scope.FilterF = true;
    
    $scope.projects = [];
    $scope.notifications = [];
    $scope.cards = [];

    $scope.local = server.local;

    $scope.Search = function ( ) {
        
        if ( $scope.SearchPhrase.length >= 3 ) {

            $scope.cards.length = 0;

            for ( let i = 0; i < $scope.projects.length; i++ ) {
                /*
                if ( !( $scope.FilterA || $scope.projects[i].filters[0] == false ) ) {

                    continue; }

                if ( !( $scope.FilterB || $scope.projects[i].filters[1] == false ) ) {

                    continue; }

                if ( !( $scope.FilterC || $scope.projects[i].filters[2] == false ) ) {

                    continue; }

                if ( !( $scope.FilterD || $scope.projects[i].filters[3] == false ) ) {

                    continue; }

                if ( !( $scope.FilterE || $scope.projects[i].filters[4] == false ) ) {

                    continue; }

                if ( !( $scope.FilterF || $scope.projects[i].filters[5] == false ) ) {

                    continue; }
                    */
                if ( $scope.projects[i].title.toLowerCase().search( $scope.SearchPhrase.toLowerCase() ) != -1 || $scope.projects[i].depiction.toLowerCase().search( $scope.SearchPhrase.toLowerCase() ) != -1 ) {
                    
                    $scope.cards.push( $scope.projects[i] ); } } }

        else {

            $scope.cards = $scope.projects; }

        };

    $scope.ShowProjectPreview = function ( index, event ) {

        var Project = {

            title: $scope.cards[index].title,
            description: $scope.cards[index].description,
            roles: $scope.cards[index].roles,
            
            favourite: $scope.cards[index].favourite,
            recruitment: $scope.cards[index].recruitment,

            image: $scope.cards[index].image,
            hash: $scope.cards[index].hash

            };

        $mdDialog.show( {
            
            controller: ProjectPreviewController,
            templateUrl: 'project-preview.html',
            parent: angular.element( document.body ),
            locals: { project: Project },  
            targetEvent: event,
            clickOutsideToClose: true,
            fullscreen: true
            
            } )
        
       .then( 
            
            function ( response ) {
                    
                if ( response == "Show" ) {

                    $window.location.href = "project.html?project=" + Project.hash;

                    }

                else if ( response == "Apply" ) {

                    $window.location.href = "project.html?project=" + Project.hash + "&apply=true";

                    }

                },
                
            function ( ) {

                $scope.cards[index].favourite = Project.favourite;
                
                }
                
            );      
                    
        };

    $scope.EnterTutorial = function ( ) {

        $http.get( server.url + server.api + "/tutorial?value=true" ).then(

            function ( response ) {

                $window.location.reload();

                },

            function ( response ) {

                console.log( "ERROR #" + response.status + " IN ENTER_TUTORIAL: " + response.data );

                $mdToast.show(

                    $mdToast.simple()
                        .textContent( 'Podczas otwierania samouczka wystąpił błąd! Spróbuj ponownie.' )
                        .position( 'bottom right' )
                        .hideDelay( 5000 )

                    );

                }

            );

        };

    $scope.ContinueTutorial = function ( ) {

        $scope.TutorialState++;

        $scope.Tutorial = angular.copy( $scope.TutorialData[ $scope.TutorialState - 1 ] );
        $scope.Tutorial.text = $sce.trustAsHtml( $scope.Tutorial.text );

        };

    $scope.LeaveTutorial = function ( ) {

        $scope.TutorialState = 0;

        $http.get( server.url + server.api + "/tutorial?value=false" ).then(

            function ( response ) {

                $window.location.reload();

                },

            function ( response ) {

                console.log( "ERROR #" + response.status + " IN LEAVE_TUTORIAL: " + response.data );

                $mdToast.show(

                    $mdToast.simple()
                        .textContent( 'Podczas zamykania samouczka wystąpił błąd!' )
                        .position( 'bottom right' )
                        .hideDelay( 5000 )

                    );

                }

            );

        };

    $scope.ToggleNotifications = function ( ) {

        // Notifications states:
        // 0 - hidden
        // 1 - about to show
        // 2 - shown
        // 3 - about to glow
        // 4 - glowing

        if ( $scope.NotificationsState != 1 && $scope.NotificationsState != 2 ) {

            $scope.NotificationsState = 1;

            $interval(

                function ( ) {

                    $scope.NotificationsState = 2;

                },

                300, 1 ); }

        else {

            $scope.NotificationsState = 0; }

        };

    $scope.LaunchNotification = function ( notification ) {

        $http.get( server.url + server.api + "/notification?hash=" + notification.hash ).then(

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

        $interval(

            function ( ) {

                if ( $scope.NotificationsState == 3 ) {

                    $scope.NotificationsState = 4; }

                else if ( $scope.NotificationsState == 4 ) {

                    $scope.NotificationsState = 3; }

            },

            1750 );

        $http.get( server.url + server.api + "/browser" ).then(

            function ( response ) {

                for ( let i = 0; i < response.data.projects.length; i++ ) {

                    if ( response.data.projects[i].favourite ) {

                        $scope.projects.push( response.data.projects[i] ); } }

                $scope.cards = $scope.projects;
                $scope.notifications = response.data.notifications;

                for ( let i = 0; i < $scope.notifications.length; i++ ) {

                    if ( $scope.notifications[i].seen == false ) {

                        $scope.NotificationsState = 3;

                        break; } }

                if ( response.data.tutorial ) {

                    $http.get( server.url + "/tutorials/favourite.json" ).then(

                        function ( subresponse ) {

                            $scope.TutorialData = subresponse.data;
                            $scope.TutorialLength = subresponse.data.length;

                            $scope.TutorialData.sort(

                                function ( a, b ) {

                                    if ( a.step > b.step ) {

                                        return 1; }

                                    if ( a.step < b.step ) {

                                        return -1; }

                                    return 0; }

                                );

                            $scope.ContinueTutorial();

                            },

                        function ( subresponse ) {

                            console.log( "ERROR #" + subresponse.status + " IN SETUP: " + response.data );

                            $mdToast.show(

                                $mdToast.simple()
                                    .textContent( 'Podczas wczytywania samouczka wystąpił błąd!' )
                                    .position( 'bottom right' )
                                    .hideDelay( 5000 )

                                );

                            }

                        );

                    }

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

                } );

        };
    
    function ProjectPreviewController ( $scope, $http, $mdDialog, $mdToast, server, project ) {

        $scope.Project = project;

        $scope.local = server.local;

        $scope.hide = function() {
            
            $mdDialog.hide();
            
            };

        $scope.cancel = function() {
            
            $mdDialog.cancel();
            
            };

        $scope.UpdateFavourite = function ( ) {

            $http.get( server.url + server.api + "/favourite?hash=" + $scope.Project.hash + "&value=" + ( !$scope.Project.favourite ? "true" : "false" ) ).then(

                function ( response ) {

                    $scope.Project.favourite = !$scope.Project.favourite;

                    },

                function ( response ) {

                    console.log( "ERROR #" + response.status + " IN UPDATE_FAVOURITE: " + response.data );

                    if ( $scope.Project.favourite ) {

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Podczas usuwania projektu z ulubionych wystąpił błąd! Spróbuj ponownie.' )
                                .position( 'bottom right' )
                                .hideDelay( 5000 )

                            );

                        }

                    else {

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Podczas dodawania projektu do ulubionych wystąpił błąd! Spróbuj ponownie.' )
                                .position( 'bottom right' )
                                .hideDelay( 5000 )

                            );

                        }

                    }

                );

            };

        $scope.Respond = function( response ) {
            
            $mdDialog.hide( response );
            
            };
        
        }

    } ] );