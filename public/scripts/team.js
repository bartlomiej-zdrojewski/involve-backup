/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'TeamController', [ '$scope', '$window', '$location', '$http', '$interval', '$sce', '$mdDialog', '$mdToast', 'server', function ( $scope, $window, $location, $http, $interval, $sce, $mdDialog, $mdToast, server ) {

    $scope.Mentor = false;
    $scope.Leader = false;
    $scope.Recruitment = false;
    $scope.Tutorial = {};
    $scope.TutorialData = {};
    $scope.TutorialLength = 0;
    $scope.TutorialState = 0;
    $scope.NotificationsState = 0;
    
    $scope.MemerID = "";
    $scope.MemberName = "";
    $scope.MemberSurname = "";
    $scope.MemberDescription = "";
    $scope.MemberRoles = [];
    $scope.MemberImage = "";

    $scope.members = [];
    $scope.invitations = [];

    $scope.local = server.local;

    $scope.Appreciate = function ( member, role, event ) {

        $mdDialog.show(

            $mdDialog.confirm ( )

                .title( 'Wyróżnianie członka zespołu' )
                .textContent( 'Zaraz wyróżnisz członka zespołu. Jest to specjalne odznaczenie, zarezerwowane wyłącznie dla wyjątkowo utalentowanych użytkowników. Po nadaniu odznaczenia, użytkownik uzyskuje stopień profesjonalisty w umiejętności skojarzonej z wybraną rolą. Kontynuować?' )
                .ariaLabel( 'Wyróżnianie członka zespołu' )
                .ok( 'Konynuuj' )
                .cancel( 'Anuluj' )
                .parent( angular.element( document.body ) )
                .targetEvent( event )
                .clickOutsideToClose( true )

                ).then(

                    function ( ) {

                        for ( let i = 0; i < $scope.members.length; i++ ) {

                            if ( $scope.members[i].id == member ) {

                                for ( let j = 0; j < $scope.members[i].roles.length; j++ ) {

                                    if ( $scope.members[i].roles[j].title == role.title ) {

                                        $scope.members[i].roles[j].appreciated = true;

                                        break; } }

                                break; } }

                        $http.post( server.url + server.api + "/team/appreciate", {

                            id: member,
                            project: $scope.ProjectHash,

                            role: role.title,
                            explanation: ""

                            } ).then(

                                function ( response ) {

                                    $mdToast.show(

                                        $mdToast.simple()
                                            .textContent( 'Członek zespołu został wyróżniony!' )
                                            .position( 'bottom right' )
                                            .hideDelay( 3000 )

                                        );

                                    },

                                function ( response ) {

                                    console.log( "ERROR #" + response.status + " IN APPRECIATE: " + response.data );

                                    $mdToast.show(

                                        $mdToast.simple()
                                            .textContent( 'Podczas wyróżniania członka zespołu wystąpił błąd! Spróbuj ponownie.' )
                                            .position( 'bottom right' )
                                            .hideDelay( 5000 )

                                        );

                                    for ( let i = 0; i < $scope.members.length; i++ ) {

                                        if ( $scope.members[i].id == member ) {

                                            for ( let j = 0; j < $scope.members[i].roles.length; j++ ) {

                                                if ( $scope.members[i].roles[j].title == role.title ) {

                                                    $scope.members[i].roles[j].appreciated = false;

                                                    break; } }

                                            break; } }

                                    }

                                );

                        },

                    function ( ) {

                        // NOTHING

                        }

                    );
        
        };
    
    $scope.ShowMember = function ( member ) {

        $scope.MemberID = member.id;
        $scope.MemberName = member.name;
        $scope.MemberSurname = member.surname;
        $scope.MemberRoles = member.roles;
        $scope.MemberDescription = member.description;
        $scope.MemberImage = member.avatar;

        document.getElementsByName( "title-test" )[0].innerHTML = member.name + " " + member.surname;

        if ( document.getElementsByName( "title-test" )[0].clientWidth > document.getElementsByName( "title" )[0].clientWidth ) {

            $scope.MemberName = $scope.MemberName.substr( 0, 1 ) + "."; }

        };

    $scope.ReportMember = function ( member ) {

        var Dialog = $mdDialog.prompt()
            
            .title( 'Zgłoś użytkownika' )
            .textContent( 'Użytkownik zostanie zgłoszony jako szkodliwy. Krótko uzasadnij powód zgłoszenia.' )
            .placeholder( 'Uzasadnienie zgłoszenia' )
            .ariaLabel( 'Zgłoś użytkownika' )
            .initialValue( '' )
            .targetEvent( event )
            .ok( 'Wyślij' )
            .cancel( 'Anuluj' );

        $mdDialog.show( Dialog ).then(
            
            function ( response ) {

                $http.post( server.url + server.api + "/team/report", {
            
                    id: member.id,
                    project: $scope.ProjectHash,
                    explanation: response

                    } ).then(

                        function ( subresponse ) {

                            $mdToast.show(

                                $mdToast.simple()
                                    .textContent( 'Zgłoszenie zostało wysłane!' )
                                    .position( 'bottom right' )
                                    .hideDelay( 3000 )

                                );

                            },

                        function ( subresponse ) {

                            console.log( "ERROR #" + subresponse.status + " IN REPORT_MEMBER: " + subresponse.data );

                            $mdToast.show(

                                $mdToast.simple()
                                    .textContent( 'Podczas wysyłania zgłoszenia wystąpił błąd! Spróbuj ponownie.' )
                                    .position( 'bottom right' )
                                    .hideDelay( 5000 )

                                );

                            }
                        );
                
                },

            function ( ) {
                
                // NOTHING
                
                }
            
            );

        };

    $scope.DeleteMember = function ( member ) {

        var Dialog = $mdDialog.prompt()
            
            .title( 'Usuń użytkownika z projektu' )
            .textContent( 'Usunięcie członka zespołu to poważny krok. Jeśli dobrze to przemyślałeś, napisz krótkie uzasadnienie swojej decyzji.' )
            .placeholder( 'Uzasadnienie decyzji' )
            .ariaLabel( 'Usuń użytkownika z projektu' )
            .initialValue( '' )
            .targetEvent( event )
            .ok( 'Potwierdź' )
            .cancel( 'Anuluj' );

        $mdDialog.show( Dialog ).then(
            
            function ( response ) {

                var Subdialog = $mdDialog.confirm ( )
                    
                    .title( 'Zaraz usuniesz członka zespołu' )
                    .textContent( 'Czy jesteś całkowicie pewien?' )
                    .ariaLabel( 'Zaraz usuniesz członka zespołu' )
                    .targetEvent( event )
                    .ok( 'Tak, całkowicie' )
                    .cancel( 'Nie, jeszcze to przemyślę' );

                $mdDialog.show( Subdialog ).then(
                    
                    function ( ) {

                        $http.post( server.url + server.api + "/team/delete", {
            
                            id: member.id,
                            project: $scope.ProjectHash,
                            explanation: response

                            } ).then(

                                function ( subresponse ) {

                                    for ( let i = 0; i < $scope.members.length; i++ ) {

                                        if ( member.id == $scope.members[i].id ) {

                                            $scope.members.splice( i, 1 );

                                            break; } }

                                    },

                                function ( subresponse ) {

                                    console.log( "ERROR #" + response.status + " IN DELETE_MEMBER: " + response.data );

                                    $mdToast.show(

                                        $mdToast.simple()
                                            .textContent( 'Podczas usuwania członka zespołu wystąpił błąd! Spróbuj ponownie.' )
                                            .position( 'bottom right' )
                                            .hideDelay( 5000 )

                                        );

                                }

                            );

                        },
                    
                    function ( ) {
                        
                        // NOTHING
                        
                        }
                    
                    );
                
                },

            function ( ) {
                
                // NOTHING
                
                }
            
            );

        };

    $scope.SendInvitation = function ( event ) {

        var Dialog = $mdDialog.prompt ( )
            
            .title( 'Kogo chcesz zaprosić do projektu?' )
            .textContent( 'Wprowadź adres e-mail osoby, którą chcesz zaprosić. Nie musi to być użytkownik platformy.' )
            .placeholder( 'Adres email' )
            .ariaLabel( 'Zaproś osobę' )
            .initialValue( '' )
            .targetEvent( event )
            .ok( 'Wyślij' )
            .cancel( 'Anuluj' );

        $mdDialog.show( Dialog ).then(
            
            function ( response ) {
                
                if ( response == undefined ) {

                    return; }

                if ( response.match( /[A-Za-z0-9!#$%&'*+-/=?^_`{|}~]+@[A-Za-z0-9-]+(.[A-Za-z0-9-]+)*/ ) == null ) {

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Ten wpis nie przypomina adresu e-mail!' )
                            .position( 'bottom right' )
                            .hideDelay( 4000 )

                        );

                    return; }

                let Invitation = {

                    name: response,
                    surname: "",
                    contact: response,

                    image: "default.jpg",
                    date: "przed chwilą"

                    };

                $scope.invitations.push( Invitation );

                $http.post( server.url + server.api + "/team/invite", {
                    
                    project: $scope.ProjectHash,
                    contact: response

                    } ).then(

                        function ( subresponse ) {

                            // NOTHING

                            },

                        function ( subresponse ) {

                            console.log( "ERROR #" + subresponse.status + " IN SEND_INVITATION: " + subresponse.data );

                            $mdToast.show(

                                $mdToast.simple()
                                    .textContent( 'Podczas wysyłania zaproszenia wystąpił błąd! Spróbuj ponownie.' )
                                    .position( 'bottom right' )
                                    .hideDelay( 5000 )

                                );

                            for ( let i = 0; i < $scope.invitations.length; i++ ) {

                                if ( Invitation.name == $scope.invitations[i].name && Invitation.surname == $scope.invitations[i].surname && Invitation.date == $scope.invitations[i].date ) {

                                    $scope.invitations.splice( i, 1 );

                                    break; } }

                            }
                        );

                },
            
            function ( ) {

                // NOTHING
            
                }

            );

        };

    $scope.CancelInvitation = function ( invitation ) {

        $http.post( server.url + server.api + "/team/uninvite", {
            
            project: $scope.ProjectHash,
            contact: invitation.contact

            } ).then(

                function ( response ) {

                    for ( let i = 0; i < $scope.invitations.length; i++ ) {

                        if ( invitation.name == $scope.invitations[i].name && invitation.surname == $scope.invitations[i].surname && invitation.date == $scope.invitations[i].date ) {

                            $scope.invitations.splice( i, 1 );

                            break; } }

                    },

                function ( response ) {

                    console.log( "ERROR #" + response.status + " IN CANCEL_INVITATION: " + response.data );

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Podczas anulowania zaproszenia wystąpił błąd! Spróbuj ponownie.' )
                            .position( 'bottom right' )
                            .hideDelay( 5000 )

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

        $scope.ProjectHash = $location.search().project;

        $http.get( server.url + server.api + "/team?hash=" + $scope.ProjectHash ).then(

            function ( response ) {

                $scope.Mentor = response.data.mentor;
                $scope.Leader = response.data.leader;
                $scope.Recruitment = response.data.recruitment;

                $scope.members = response.data.members;
                $scope.invitations = response.data.invitations;
                $scope.notifications = response.data.notifications;

                for ( let i = 0; i < $scope.members.length; i++ ) {

                    for ( let j = 0; j < $scope.members[i].roles.length; j++ ) {

                        if ( $scope.members[i].roles[j].title == "Lider zespołu" ) {

                            $scope.members[i].leader = true;

                            break; } } }

                $scope.ShowMember( $scope.members[0] );

                for ( let i = 0; i < $scope.notifications.length; i++ ) {

                    if ( $scope.notifications[i].seen == false ) {

                        $scope.NotificationsState = 3;

                        break; } }

                if ( response.data.tutorial ) {

                    $http.get( server.url + "/tutorials/team.json" ).then(

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
