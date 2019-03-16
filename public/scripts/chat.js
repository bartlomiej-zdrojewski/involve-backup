/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'ChatController', [ '$scope', '$window', '$location', '$http', '$interval', '$timeout', '$sce', '$mdToast', '$mdDialog', 'server', function ( $scope, $window, $location, $http, $interval, $timeout, $sce, $mdDialog, $mdToast, server ) {

    $scope.Leader = false;

    $scope.Socket = io(); // DEBUG: 'http://localhost:5000'
    $scope.Message = "";

    $scope.Tutorial = {};
    $scope.TutorialData = {};
    $scope.TutorialLength = 0;
    $scope.TutorialState = 0;
    $scope.NotificationsState = 0;

    $scope.members = [];
    $scope.chat = [];
    $scope.notifications = [];

    $scope.local = server.local;

    $scope.Socket.on( 'message', function ( response ) {

        if ( $scope.chat.length > 0 ) {

            if ( $scope.chat[ $scope.chat.length - 1 ].id == response.from.id ) {

                $scope.chat[ $scope.chat.length - 1 ].messages.push( response.msg ); }

            else {

                $scope.chat.push( {

                    id: response.from.id,
                    name: response.from.name,
                    surname: response.from.surname,

                    date: ( Date.now() / 1000 ),
                    messages: [ response.msg ]

                    } );

                } }

        else {

            $scope.chat.push( {

                id: response.from.id,
                name: response.from.name,
                surname: response.from.surname,

                date: ( Date.now() / 1000 ),
                messages: [ response.msg ]

                } );

            }

        $scope.$apply();

        $timeout( function ( ) {
            
            var Chat = document.getElementsByName( "chat" )[0];
            Chat.scrollTop = Chat.scrollHeight;

            }, 0, false );

        } );

    $scope.Socket.on( 'joined', function ( response ) {

        for ( let i = 0; i < $scope.members.length; i++ ) {

            if ( $scope.members[i].id == response.id ) {

                $scope.members[i].available = true;

                break; } }

        } );

    $scope.Socket.on( 'left', function ( response ) {

        for ( let i = 0; i < $scope.members.length; i++ ) {

            if ( $scope.members[i].id == response.id ) {

                $scope.members[i].available = false;

                break; } }

        } );

    $scope.Send = function ( ) {

        if ( $scope.Message == "" ) {

            return; }

        $scope.Socket.emit( 'message', {

            hash: $scope.ProjectHash,
            msg: $scope.Message

            } );

        $scope.Message = "";

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

        $scope.ProjectHash = $location.search().project;

        $interval(

            function ( ) {

                if ( $scope.NotificationsState == 3 ) {

                    $scope.NotificationsState = 4; }

                else if ( $scope.NotificationsState == 4 ) {

                    $scope.NotificationsState = 3; }

            },

            1750 );

        $http.get( server.url + server.api + "/chat?hash=" + $scope.ProjectHash ).then(

            function ( response ) {

                $scope.Leader = response.data.leader;

                $scope.members = response.data.members;
                $scope.chat = response.data.chat;
                $scope.notifications = response.data.notifications;

                $scope.Socket.emit( 'join', {

                    hash: $scope.ProjectHash

                    } );

                $timeout( function ( ) {
                    
                    var Chat = document.getElementsByName( "chat" )[0];
                    Chat.scrollTop = Chat.scrollHeight;

                    }, 0, false );

                for ( let i = 0; i < $scope.notifications.length; i++ ) {

                    if ( $scope.notifications[i].seen == false ) {

                        $scope.NotificationsState = 3;

                        break; } }

                if ( response.data.tutorial ) {

                    $http.get( server.url + "/tutorials/chat.json" ).then(

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

                }

            );

        };

    } ] );

Involve.directive( 'onEnter', function ( ) {

    return function ( scope, element, attrs ) {

        element.bind( "keydown keypress", function ( event ) {

            if ( event.which === 13 ) {

                scope.$apply( function ( ) {

                    scope.$eval( attrs.onEnter );
                    
                    } );

                event.preventDefault(); }
            
            } );
        
        };
    
    } );