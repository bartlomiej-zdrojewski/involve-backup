﻿﻿/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'ProfileController', [ '$scope', '$window', '$http', '$interval', '$sce', '$mdDialog', '$mdToast', 'server', function ( $scope, $window, $http, $interval, $sce, $mdDialog, $mdToast, server ) {

    $scope.PersonalDataActive = false;
    $scope.DescriptionActive = false;

    $scope.PersonalDataIcon = "profile-settings.svg";
    $scope.DescriptionIcon = "profile-settings.svg";

    $scope.Tutorial = {};
    $scope.TutorialData = {};
    $scope.TutorialLength = 0;
    $scope.TutorialState = 0;
    $scope.NotificationsState = 0;

    $scope.user = {};
    $scope.skills = [];
    $scope.projects = [];
    $scope.notifications = [];

    $scope.local = server.local;

    $scope.Redirect = function ( url ) {

        $window.location.href = url;

        };

    $scope.UpdatePesonalData = function ( ) {
        
        if ( $scope.PersonalDataActive == true ) {

            $scope.PersonalDataActive = false;
            $scope.PersonalDataIcon = "profile-settings.svg";

            $http.post( server.url + server.api + "/profile/personal_data", {
                
                schoolname: $scope.user.schoolname,
                education: $scope.user.education,
                city: $scope.user.city,
                sex: $scope.user.sex

                } ).then(

                function ( response ) {

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Dane osobowe zostały zaktualizowane!' )
                            .position( 'bottom right' )
                            .hideDelay( 3000 )

                        );

                    },

                function ( response ) {

                    console.log( "ERROR #" + response.status + " IN UPDATE_PERSONAL_DATA: " + response.data );

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Podczas aktualizowania danych osobowych wystąpił błąd! Spróbuj ponownie.' )
                            .position( 'bottom right' )
                            .hideDelay( 5000 )

                        );

                    }
                
                );

            }

        else if ( $scope.PersonalDataActive == false ) {

            $scope.PersonalDataActive = true;
            $scope.PersonalDataIcon = "profile-settings-save.svg";

            }

        };

    $scope.UpdateDescription = function ( ) {

        if ( $scope.DescriptionActive == true ) {

            $scope.DescriptionActive = false;
            $scope.DescriptionIcon = "profile-settings.svg";

            $http.post( server.url + server.api + "/profile/description", {
                
                description: $scope.user.description

                } ).then(

                function ( response ) {

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Prezentacja została zaktualizowana!' )
                            .position( 'bottom right' )
                            .hideDelay( 3000 )

                        );

                    },

                function ( response ) {

                    console.log( "ERROR #" + response.status + " IN UPDATE_DESCRIPTION: " + response.data );

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Podczas aktualizowania prezentacji wystąpił błąd! Spróbuj ponownie.' )
                            .position( 'bottom right' )
                            .hideDelay( 5000 )

                        );

                    }
                
                );

            }

        else if ( $scope.DescriptionActive == false ) {

            $scope.DescriptionActive = true;
            $scope.DescriptionIcon = "profile-settings-save.svg";

            }

        };

    $scope.UploadFile = function ( ) {

        var File = document.getElementsByName( "file" )[0].files[0];
        var Form = new FormData();

        if ( File.type.substr( 0, 5 ) != "image" ) {

            $mdToast.show(

                $mdToast.simple()
                    .textContent( 'Przesłany plik nie jest obrazem!' )
                    .position( 'bottom right' )
                    .hideDelay( 4000 )

                );

            return; }

        if ( File.size > ( 10 * 1024 * 1024 ) ) {

            $mdToast.show(

                $mdToast.simple()
                    .textContent( 'Przesłany plik jest za duży! Ma powyżej 10 MB!' )
                    .position( 'bottom right' )
                    .hideDelay( 5000 )

                );

            return; }

        Form.append( 'filename', File.name );
        Form.append( 'filesize', File.size );
        Form.append( 'filetype', File.type );
        Form.append( 'filedata', File );

        $http( {
            
            method: 'POST',
            url: server.url + server.api + "/profile/picture",
            
            headers: { 'Content-Type': undefined },
            transformRequest: angular.identity,

            data: Form

            } ).then(
                
                function ( response ) {

                    $scope.user.avatar = response.data.image + "?rand=" + ( Math.random() % 10000 );

                    },
                
                function ( response ) {

                    console.log( "ERROR #" + response.status + " IN UPLOAD_FILE: " + response.data );

                    $mdDialog.show(

                        $mdDialog.alert ( )

                            .clickOutsideToClose( true )
                            .title( 'Zdjęcie nie zostało zaktualizowane' )
                            .textContent( 'Serwer nie był w stanie zaktualizować twojego zdjęcia. Spróbuj ponownie później.' )
                            .ariaLabel( 'Zdjęcie nie zostało zaktualizowane' )
                            .ok( 'Rozumiem' )
                            .targetEvent( event )

                        );

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

        $http.get( server.url + server.api + "/profile" ).then(

            function ( response ) {

                $scope.user = response.data.user;
                $scope.skills = response.data.skills;
                $scope.projects = response.data.projects;
                $scope.notifications = response.data.notifications;

                for ( let i = 0; i < $scope.notifications.length; i++ ) {

                    if ( $scope.notifications[i].seen == false ) {

                        $scope.NotificationsState = 3;

                        break; } }

                if ( response.data.tutorial ) {

                    $http.get( server.url + "/tutorials/profile.json" ).then(

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

    } ] );