/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'ReportsController', [ '$scope', '$window', '$location', '$http', '$interval', '$sce', '$mdDialog', '$mdToast', 'server', function ( $scope, $window, $location, $http, $interval, $sce, $mdDialog, $mdToast, server ) {

    $scope.Mentor = false;
    $scope.Leader = false;

    $scope.Title = "";
    $scope.Answers = [ "", "", "", "" ];

    $scope.Draft = true;
    $scope.Draftable = false;
    $scope.Modified = false;

    $scope.Tutorial = {};
    $scope.TutorialData = {};
    $scope.TutorialLength = 0;
    $scope.TutorialState = 0;
    $scope.NotificationsState = 0;

    $scope.reports = [];
    $scope.responses = [];
    $scope.notifications = [];

    $scope.local = server.local;

    $scope.DateToText = function ( date ) {

        var Time = new Date ( date * 1000 );
        var Month = "";

        switch ( Time.getMonth() ) {

            case 0:  Month = "stycznia";        break;
            case 1:  Month = "lutego";          break;
            case 2:  Month = "marca";           break;
            case 3:  Month = "kwietnia";        break;
            case 4:  Month = "maja";            break;
            case 5:  Month = "czerwca";         break;
            case 6:  Month = "lipca";           break;
            case 7:  Month = "sierpnia";        break;
            case 8:  Month = "września";        break;
            case 9:  Month = "października";    break;
            case 10: Month = "listopada";       break;
            case 11: Month = "grudnia";         break;

            }

        return ( Time.getDate() + " " + Month + " " + Time.getFullYear() );
        
        };

    $scope.Upload = function ( event ) {

        $mdDialog.show( {

            controller: UploadController,
            templateUrl: 'reports-upload.html',
            parent: angular.element( document.body ),
            locals: { hash: $scope.ProjectHash },
            targetEvent: event,
            clickOutsideToClose: false,
            fullscreen: true

            } ).then(

                function ( response ) {

                    $scope.Draftable = false;

                    },

                function ( response ) {

                    // NOTHING

                    }

                );

        };

    $scope.CreateReport = function ( ) {

        $scope.Draftable = false;

        var Report = {

            date: 0,
            answers: [ "", "", "", "" ],

            title: "Nowy raport",
            icon: "reports-draft.svg"

            };

        $scope.reports.unshift( Report );
        
        $scope.ShowReport( $scope.reports[0] );
        $scope.SaveReport();

        };

    $scope.ShowReport = function ( report, event ) {

        if ( $scope.Draft && $scope.Modified ) {

            var Dialog = $mdDialog.confirm ( )
                
                .title( 'Raport nie zostanie zapisany' )
                .textContent( 'Przed przełączeniem raportu powinieneś go zapisać. Czy mimo to chcesz kontynuować?' )
                .ariaLabel( 'Raport nie zostanie zapisany' )
                .targetEvent( event )
                .ok( 'Tak, kontynuuj' )
                .cancel( 'Pozwól mi zapisać' );

            $mdDialog.show( Dialog ).then(
                
                function ( ) {

                    if ( report.date != 0 ) {
                        
                        $scope.Title = report.title;
                        $scope.Answers = angular.copy( report.answers );

                        $scope.Draft = false;
                        $scope.Modified = false;

                        }

                    else {

                        $scope.Title = report.title;
                        $scope.Answers = angular.copy( report.answers );

                        $scope.Draft = true;
                        $scope.Modified = false;

                        }

                    },

                function ( ) {
                    
                    // NOTHING
                    
                    }
                
                );

            }

        else {

            if ( report.date != 0 ) {
                
                $scope.Title = report.title;
                $scope.Answers = angular.copy( report.answers );

                $scope.Draft = false;
                $scope.Modified = false;

                }

            else {
                
                $scope.Title = report.title;
                $scope.Answers = angular.copy( report.answers );

                $scope.Draft = true;
                $scope.Modified = false;

                }

            }

        };

    $scope.CancelReport = function ( event ) {
        
        $scope.Draft = false;
        $scope.Modified = false;

        $scope.ShowReport( $scope.reports[0], event );

        };

    $scope.SaveReport = function ( event ) {
        
        $scope.Modified = false;

        for ( let i = 0; i < $scope.reports.length; i++ ) {

            if ( $scope.reports[i].date == 0 ) {

                $scope.reports[i].answers = angular.copy( $scope.Answers );
                
                break; } }

        $http.post( server.url + server.api + "/reports/update?hash=" + $scope.ProjectHash, {
            
            reports: $scope.reports

            } ).then(

                function ( response ) {

                    // NOTHING

                    },

                function ( response ) {

                    console.log( "ERROR #" + response.status + " IN SAVE_REPORT: " + response.data );

                    $mdDialog.show(

                        $mdDialog.alert ( )

                            .clickOutsideToClose( true )
                            .title( 'Raport nie został zapisany' )
                            .textContent( 'Podczas zapisywania raportu wystąpił błąd. Spróbuj ponownie.' )
                            .ariaLabel( 'Raport nie został zapisany' )
                            .ok( 'Rozumiem' )
                            .targetEvent( event )

                        );

                    } );

        };

    $scope.SendReport = function ( event ) { // TODO: CHECK

        let Index = -1;

        for ( let i = 0; i < $scope.reports.length; i++ ) {

            if ( $scope.reports[i].date == 0 ) {

                Index = i;

                $scope.reports[i].date = Date.now() / 1000;
                $scope.reports[i].answers = angular.copy( $scope.Answers );

                $scope.reports[i].title = "Raport z dnia " + $scope.DateToText( $scope.reports[i].date ) + " roku";
                $scope.reports[i].icon = "reports-ready.svg";
                
                break; } }

        $http.post( server.url + server.api + "/reports/send?hash=" + $scope.ProjectHash, {
            
            date: ( Date.now() / 1000 ),
            answers: $scope.reports[Index].answers

            } ).then(

                function ( response ) {

                    $mdDialog.show(
                    
                        $mdDialog.alert ( )
                    
                        .clickOutsideToClose( true )
                        .title( 'Raport został wysłany' )
                        .textContent( 'Mentor otrzymał twój raport. Następny możesz mu wysłać za 3 dni.' )
                        .ariaLabel( 'Raport został wysłany' )
                        .ok( 'Super!' )
                        .targetEvent( event )
                    
                        );

                    },

                function ( response ) {

                    console.log( "ERROR #" + response.status + " IN SEND_REPORT: " + response.data );

                    $mdDialog.show(
                    
                        $mdDialog.alert ( )
                    
                            .clickOutsideToClose( true )
                            .title( 'Raport nie został wysłany' )
                            .textContent( 'Podczas wysyłania raportu wystąpił błąd. Spróbuj ponownie.' )
                            .ariaLabel( 'Raport nie został wysłany' )
                            .ok( 'Rozumiem' )
                            .targetEvent( event )
                    
                        );
                
                    } );

        $scope.Draft = false;
        $scope.Modified = false;

        $scope.SaveReport();
        $scope.ShowReport( $scope.reports[0] );

        };

    $scope.ShowResponse = function ( response, event ) {

        $mdDialog.show( {
            
            controller: ProjectResponseController,
            templateUrl: 'project-response.html',
            parent: angular.element( document.body ),
            locals: { response: response },  
            targetEvent: event,
            clickOutsideToClose: true,
            fullscreen: true
            
            } )
        
        .then(
            
            function ( ) {

                // NOTHING

                },

            function ( ) {

                // NOTHING

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

        $scope.ProjectHash = $location.search().project;

        $interval(

            function ( ) {

                if ( $scope.NotificationsState == 3 ) {

                    $scope.NotificationsState = 4; }

                else if ( $scope.NotificationsState == 4 ) {

                    $scope.NotificationsState = 3; }

            },

            1750 );

        $http.get( server.url + server.api + "/reports?hash=" + $scope.ProjectHash ).then(

            function ( response ) {

                $scope.Mentor = response.data.mentor;
                $scope.Leader = response.data.leader;
                $scope.Closed = false; // TODO: $scope.Closed = response.data.closed;

                $scope.reports = response.data.reports;
                $scope.responses = response.data.responses;
                $scope.notifications = response.data.notifications;

                $scope.Draftable = true;
        
                for ( let i = 0; i < $scope.reports.length; i++ ) {
            
                    if ( $scope.reports[i].date != 0 ) {

                        $scope.reports[i].title = "Raport z dnia " + $scope.DateToText( $scope.reports[i].date ) + " roku";
                        $scope.reports[i].icon = "reports-ready.svg";

                        if ( ( ( Date.now() / 1000 ) - $scope.reports[i].date ) < ( 3 * 24 * 3600 ) ) {

                            $scope.Draftable = false; } }

                    else if ( !$scope.Closed ) {

                        $scope.reports[i].title = "Nowy raport";
                        $scope.reports[i].icon = "reports-draft.svg";
                
                        $scope.Draftable = false; }

                    else {

                        $scope.reports.splice( i, 1 );

                        i--; } }

                for ( let i = 0; i < $scope.responses.length; i++ ) {

                    if ( $scope.responses[i].text == "" ) {

                        $scope.responses.splice( i, 1 );

                        i--; } }

                for ( let i = 0; i < $scope.responses.length; i++ ) {

                    $scope.responses[i].title = "Odpowiedź z dnia " + $scope.DateToText( $scope.responses[i].date ) + " roku"; }

                if ( $scope.reports.length > 0 ) {

                    $scope.ShowReport( $scope.reports[0] ); }

                else {

                    $scope.Title = "Raport";
                    $scope.Answers = [ "", "", "", "" ];
            
                    $scope.Draft = false; }

                for ( let i = 0; i < $scope.notifications.length; i++ ) {

                    if ( $scope.notifications[i].seen == false ) {

                        $scope.NotificationsState = 3;

                        break; } }

                if ( response.data.tutorial ) {

                    $http.get( server.url + "/tutorials/reports.json" ).then(

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

    function UploadController ( $scope, $http, $mdDialog, server, hash ) {

        $scope.Link = "";
        $scope.LinkSwitch = true;
        $scope.FileSwitch = false;

        $scope.FileReady = false;
        $scope.Status = "Oczekiwanie na dokument...";
        $scope.StatusColor = "#000000";

        $scope.ProjectHash = hash;

        $scope.local = server.local;

        $scope.CheckFile = function ( ) {

            $scope.FileReady = false;

            var File = document.getElementsByName( "file" )[0].files[0];

            if ( File.type != "application/pdf" ) {

                $scope.Status = "Dokument musi być plikiem w formacie PDF.";
                $scope.StatusColor = "#FF1744";

                return; }

            if ( File.size > ( 10 * 1024 * 1024 ) ) {

                $scope.Status = "Dokument jest za duży. Maksymalna dopuszczalna wielkość pliku to 10 MB.";
                $scope.StatusColor = "#FF1744";

                return; }

            $scope.Status = "Dokument jest gotowy do wysłania.";
            $scope.StatusColor = "#02E677";

            $scope.FileReady = true;

            };

        $scope.UploadFile = function ( ) {

             var File = document.getElementsByName( "file" )[0].files[0];
             var Form = new FormData();

            if ( File.type != "application/pdf" ) {

                $scope.Status = "Dokument musi być plikiem w formacie PDF.";
                $scope.StatusColor = "#FF0000";

                return; }

            if ( File.size > ( 10 * 1024 * 1024 ) ) {

                 $scope.Status = "Dokument jest za duży. Maksymalna dopuszczalna wielkość pliku to 10 MB.";
                 $scope.StatusColor = "#FF0000";

                 return; }

            $scope.Status = "Wysyłanie dokumentu...";
            $scope.StatusColor = "#000000";

            Form.append( 'filename', File.name );
            Form.append( 'filesize', File.size );
            Form.append( 'filetype', File.type );
            Form.append( 'filedata', File );

            $http( {

                 method: 'POST',
                 url: server.url + server.api + '/reports/document?hash=' + $scope.ProjectHash,

                 headers: { 'Content-Type': undefined },
                 transformRequest: angular.identity,

                 data: Form

                 } ).then(

                     function ( response ) {

                         $scope.Status = "Dokument został wysłany pomyślnie.";
                         $scope.StatusColor = "#02E677";

                         },

                     function ( response ) {

                         console.log( "ERROR #" + response.status + " IN UPLOAD_FILE: " + response.data );

                         $scope.Status = "Podczas wysyłania dokumentu wystąpił błąd. Spróbuj ponownie.";
                         $scope.StatusColor = "#FF0000";

                         }

                 );

             };

        $scope.UploadLink = function ( ) {

            $scope.Status = "Wysyłanie dokumentu...";
            $scope.StatusColor = "#000000";

            $scope.local = server.local;

            $http.post( server.url + server.api + '/reports/link?hash=' + $scope.ProjectHash, {

                link: $scope.Link

                } ).then(

                    function ( response ) {

                        $scope.Status = "Dokument został wysłany pomyślnie. Możesz zamknąć okno dialogowe.";
                        $scope.StatusColor = "#02E677";

                        },

                    function ( response ) {

                        console.log( "ERROR #" + response.status + " IN UPLOAD_LINK: " + response.data );

                        $scope.Status = "Podczas wysyłania dokumentu wystąpił błąd. Spróbuj ponownie.";
                        $scope.StatusColor = "#FF0000";

                        }

                    );

            };

        $scope.hide = function ( ) {

            $mdDialog.hide();

            };

        $scope.cancel = function ( ) {

            $mdDialog.cancel();

            };

        $scope.Respond = function ( response ) {

            $mdDialog.hide( response );

            };

        }


    function ProjectResponseController ( $scope, $mdDialog, server, response ) {

        $scope.Response = response;

        $scope.local = server.local;

        $scope.hide = function ( ) {
            
            $mdDialog.hide();
            
            };

        $scope.cancel = function ( ) {
            
            $mdDialog.cancel();
            
            };
        
        }

    } ] );