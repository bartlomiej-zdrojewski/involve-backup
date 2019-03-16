/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'RecruitmentController', [ '$scope', '$window', '$location', '$http', '$interval', '$sce', '$mdDialog', '$mdToast', 'server', function ( $scope, $window, $location, $http, $interval, $sce, $mdDialog, $mdToast, server ) {

    $scope.Members = [];
    $scope.Applications = [];

    $scope.Role = "";
    $scope.RoleHover = "";

    $scope.CreateRoleMenuState = false;
    $scope.Tutorial = {};
    $scope.TutorialData = {};
    $scope.TutorialLength = 0;
    $scope.TutorialState = 0;
    $scope.NotificationsState = 0;

    $scope.roles = [];
    $scope.applications = [];
    $scope.skills = [];
    $scope.notifications = [];

    $scope.local = server.local;

    $scope.Hover = function ( title ) {

        $scope.RoleHover = title;

        };

    $scope.ShowRole = function ( role ) {

        $scope.Role = role.title;
        $scope.Applications = [];

        for ( let i = 0; i < $scope.applications.length; i++ ) {

            for ( let j = 0; j < $scope.applications[i].roles.length; j++ ) {

                if ( $scope.applications[i].roles[j] == role.title ) {

                    let Application = {

                        id: $scope.applications[i].id,
                        name: $scope.applications[i].name,
                        surname: $scope.applications[i].surname,
                        avatar: $scope.applications[i].avatar,

                        description: $scope.applications[i].description,
                        explanation: $scope.applications[i].explanation,

                        role: role,
                        accepted: $scope.applications[i].accepted[j]

                        };

                    $scope.Applications.push( Application );

                    break; } } }

        };

    $scope.ChangeRecruitment = function ( role ) {

        $http.get( server.url + server.api + "/recruitment/change?hash=" + $scope.ProjectHash + "&role=" + role.title + "&value=" + role.recruitment ).then(

            function ( response ) {

                // NOTHING

                },

            function ( response ) {

                console.log( "ERROR #" + response.status + " IN CHANGE_RECRUITMENT: " + response.data );

                let Recruitment = !role.recruitment;

                for ( let i = 0; i < $scope.roles.length; i++ ) {

                    if ( $scope.roles[i].title == role.title ) {

                        $scope.roles[i].recruitment = Recruitment;

                        break; } }

                if ( Recruitment ) {

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Podczas zamykania rekrutacji na rolę wystąpił błąd! Spróbuj ponownie.' )
                            .position( 'bottom right' )
                            .hideDelay( 5000 )

                        );

                    }

                else {

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Podczas otwierania rekrutacji na rolę wystąpił błąd! Spróbuj ponownie.' )
                            .position( 'bottom right' )
                            .hideDelay( 5000 )

                        );

                    }

                }

            );

        };

    $scope.CreateRole = function ( event ) {

        let Project = {

            roles: $scope.roles,
            skills: $scope.skills

            };

        $mdDialog.show( {
            
            controller: RecruitmentRoleCreationController,
            templateUrl: 'recruitment-role-creation.html',
            parent: angular.element( document.body ),
            locals: { project: Project },
            targetEvent: event,
            clickOutsideToClose: false,
            fullscreen: true
            
            } ).then(

                function ( response ) {

                    $http.post( server.url + server.api + "/recruitment/create_role?hash=" + $scope.ProjectHash, {

                        title: response.title,
                        description: response.description,
                        skill: response.skill.hash

                        } ).then(

                            function ( subresponse ) {

                                let Icon = "";

                                for ( let i = 0; i < $scope.skills.length; i++ ) {

                                    if ( $scope.skills[i].hash == response.skill.hash ) {

                                        Icon = $scope.skills[i].icon;

                                        break; } }

                                let Role = {

                                    title: response.title,
                                    description: response.description,

                                    recruitment: true,
                                    recommended: 0,

                                    icon: Icon

                                    };

                                $scope.roles.push( Role );
                                $scope.ShowRole( Role );

                                },

                            function ( subresponse ) {

                                console.log( "ERROR #" + subresponse.status + " IN CREATE_ROLE: " + subresponse.data );

                                $mdToast.show(

                                    $mdToast.simple()
                                        .textContent( 'Podczas tworzenia roli wystąpił błąd! Spróbuj ponownie.' )
                                        .position( 'bottom right' )
                                        .hideDelay( 5000 )

                                    );

                                }
                            );

                    },

                function ( response ) {

                    // NOTHING

                    }

                );

        };

    $scope.EditRole = function ( role, event ) {

        let Project = {

            role: {

                skill: '',
                title: angular.copy( role.title ),
                description: angular.copy( role.description )

                },

            roles: angular.copy( $scope.roles )

            };

        for ( let i = 0; i < $scope.skills.length; i++ ) {

            if ( $scope.skills[i].hash == role.skill ) {

                Project.role.skill = $scope.skills[i].title;

                break; } }

        for ( let i = 0; i < Project.roles.length; i++ ) {

            if ( Project.roles[i].title == Project.role.title ) {

                Project.roles.splice( i, 1 );

                break; } }

        $mdDialog.show( {

            controller: RecruitmentRoleEditionController,
            templateUrl: 'recruitment-role-edition.html',
            parent: angular.element( document.body ),
            locals: { project: Project },
            targetEvent: event,
            clickOutsideToClose: false,
            fullscreen: true

            } ).then(

                function ( response ) {

                    console.log(role.title);
                    console.log(response.title);
                    console.log(response.description);

                    $http.post( server.url + server.api + "/recruitment/edit_role?hash=" + $scope.ProjectHash, {

                        oldTitle: role.title,
                        newTitle: response.title,
                        description: response.description

                        } ).then(

                            function ( subresponse ) {

                                role.title = response.title;
                                role.description = response.description;

                                },

                            function ( subresponse ) {

                                console.log( "ERROR #" + subresponse.status + " IN EDIT_ROLE: " + subresponse.data );

                                $mdToast.show(

                                    $mdToast.simple()
                                        .textContent( 'Podczas edytowania roli wystąpił błąd! Spróbuj ponownie.' )
                                        .position( 'bottom right' )
                                        .hideDelay( 5000 )

                                    );

                                }
                            );

                    },

                function ( response ) {

                    // NOTHING

                    }

            );

        };

    $scope.DeleteRole = function ( role, event ) {
        
        let Applied = false;
        
        for ( let i = 0; i < $scope.applications.length; i++ ) {

            for ( let j = 0; j < $scope.applications[i].roles.length; j++ ) {

                if ( $scope.applications[i].roles[j] == role.title ) {

                    Applied = true;

                    break; } } }

        if ( Applied ) {

            $mdDialog.show(
                                    
                $mdDialog.alert ( )
                                        
                    .title( 'Nie można usunąć roli' )
                    .textContent( 'Przed usunięciem roli musisz odrzucić wszystkie aplikacje i zwolnić wszystkich członków zespołu z jej pełnienia.' ) // TODO
                    .ariaLabel( 'Nie można usunąć roli' )
                    .ok( 'Rozumiem' )
                    .parent( angular.element( document.body ) )
                    .targetEvent( event )
                    .clickOutsideToClose( true )

                    ); }

        else {
            
            $http.post( server.url + server.api + "/recruitment/delete_role?hash=" + $scope.ProjectHash, {
            
                role: role.title

                } ).then(

                    function ( response ) {

                        let Index = -1;

                        for ( let i = 0; i < $scope.roles.length; i++ ) {

                            if ( $scope.roles[i].title == role.title ) {

                                Index = i;
                                $scope.roles.splice( i, 1 );

                                break; } }

                        if ( $scope.Role == role.title ) {

                            if ( Index != 0  ) {

                                $scope.ShowRole( $scope.roles[0] ); }

                            else if ( $scope.roles.length > 1 ) {

                                $scope.ShowRole( $scope.roles[1] ); }

                            else {

                                $scope.Role = "";
                                $scope.Aplications = []; } }

                        },

                    function ( response ) {

                         console.log( "ERROR #" + response.status + " IN DELETE_ROLE: " + response.data );

                         $mdToast.show(

                             $mdToast.simple()
                                 .textContent( 'Podczas usuwania roli wystąpił błąd! Spróbuj ponownie.' )
                                 .position( 'bottom right' )
                                 .hideDelay( 5000 )

                            );
                
                         }

                    );

             }

        };

    $scope.InvolveMember = function ( role, event ) {

        let Members = angular.copy( $scope.Members );

        for ( let i = 0; i < $scope.applications.length; i++ ) {

            let Valid = $scope.applications[i].member;

            for ( let j = 0; j < $scope.applications[i].roles.length && Valid; j++ ) {

                if ( $scope.applications[i].roles[j] == role.title ) {

                    Valid = false; } }

            if ( !Valid ) {

                for ( let j = 0; j < Members.length; j++ ) {

                    if ( Members[j].id === $scope.applications[i].id ) {

                        Members.splice( j, 1 );

                        break; } } } }

        $mdDialog.show( {
            
            controller: RecruitmentInvolvementController,
            templateUrl: 'recruitment-involvement.html',
            parent: angular.element( document.body ),
            locals: { members: Members },
            targetEvent: event,
            clickOutsideToClose: false,
            fullscreen: true
            
            } )
        
        .then( 
            
            function ( response ) {

                $http.post( server.url + server.api + "/recruitment/involve_member?hash=" + $scope.ProjectHash, {
            
                    id: response,
                    role: role.title

                    } ).then(

                        function ( subresponse ) {

                            for ( let i = 0; i < $scope.applications.length; i++ ) {

                                if ( $scope.applications[i].id == response ) {

                                    $scope.applications[i].roles.push( role.title );
                                    $scope.applications[i].accepted.push( true );

                                    break; } }

                            if ( $scope.Role == role.title ) {

                                $scope.ShowRole( role ); }

                            },

                        function ( subresponse ) {

                             console.log( "ERROR #" + subresponse.status + " IN INVOLVE_MEMBER: " + subresponse.data );

                             $mdToast.show(

                                 $mdToast.simple()
                                     .textContent( 'Podczas angażowania członka zespołu wystąpił błąd! Spróbuj ponownie.' )
                                     .position( 'bottom right' )
                                     .hideDelay( 5000 )

                                );
                
                             }
                        );

                },

            function ( response ) {

                // NOTHING

                }

            );

        };

    $scope.ExemptFromRole = function ( application ) {

        for ( let i = 0; i < $scope.applications.length; i++ ) {

            if ( $scope.applications[i].id == application.id ) {

                $http.post( server.url + server.api + "/recruitment/exempt_role?hash=" + $scope.ProjectHash, {
            
                    id: $scope.applications[i].id,
                    role: application.role.title

                    } ).then(

                        function ( response ) {

                            $scope.applications[i].accepted[ $scope.applications[i].roles.indexOf( application.role.title ) ] = false;

                            if ( $scope.Role == application.role.title ) {

                                $scope.ShowRole( application.role ); }

                            },

                         function ( response ) {

                             console.log( "ERROR #" + response.status + " IN EXEMPT_FROM_ROLE: " + response.data );

                             $mdToast.show(

                                 $mdToast.simple()
                                     .textContent( 'Podczas zwalniania członka zespołu z pełnienia roli wystąpił błąd! Spróbuj ponownie.' )
                                     .position( 'bottom right' )
                                     .hideDelay( 5000 )

                                );
                
                             } );

                break; } }

        };

    $scope.DismissApplication = function ( application, event ) {

        for ( let i = 0; i < $scope.applications.length; i++ ) {

            if ( $scope.applications[i].id == application.id ) {
                
                if ( $scope.applications[i].roles.length == 1 && !$scope.applications[i].member ) {

                    var Dialog = $mdDialog.prompt()
            
                        .title( 'Odrzuć aplikację' )
                        .textContent( 'Zaraz w pełni odrzucisz aplikację danego użytkownika. Napisz mu krótko, dlaczego go nie wybrałeś.' )
                        .placeholder( 'Uzasadnienie odrzucenia aplikacji' )
                        .ariaLabel( 'Odrzuć aplikację' )
                        .initialValue( '' )
                        .targetEvent( event )
                        .ok( 'Odrzuć' )
                        .cancel( 'Anuluj' );

                    $mdDialog.show( Dialog ).then(
            
                        function ( response ) {

                            $http.post( server.url + server.api + "/recruitment/dismiss_application?hash=" + $scope.ProjectHash, {
            
                                id: $scope.applications[i].id,
                                
                                response: {

                                    title: "Odrzucono twoją aplikację",
                                    text: "Lider zespołu odrzucił twoją aplikację. Swoją decyzję uzasadnił następująco:\n\n" + response

                                    }

                                } ).then(

                                    function ( subresponse ) {

                                        $scope.applications.splice( i, 1 );

                                        if ( $scope.Role == application.role.title ) {

                                            $scope.ShowRole( application.role ); }

                                        },

                                    function ( subresponse ) {

                                        console.log( "ERROR #" + subresponse.status + " IN DISMISS_APPLICATION: " + subresponse.data );

                                        $mdToast.show(

                                            $mdToast.simple()
                                                .textContent( 'Podczas odrzucania aplikacji wystąpił błąd! Spróbuj ponownie.' )
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

                    }

                else {

                    $http.post( server.url + server.api + "/recruitment/dismiss_role?hash=" + $scope.ProjectHash, {
            
                        id: $scope.applications[i].id,
                        role: application.role.title

                        } ).then(

                            function ( subresponse ) {

                                $scope.applications[i].roles.splice( $scope.applications[i].roles.indexOf( application.role.title ), 1 );
                                $scope.applications[i].accepted.splice( $scope.applications[i].roles.indexOf( application.role.title ), 1 );

                                if ( $scope.Role == application.role.title ) {

                                    $scope.ShowRole( application.role ); }

                                },

                            function ( subresponse ) {

                                 console.log( "ERROR #" + subresponse.status + " IN DISMISS_APPLICATION: " + subresponse.data );

                                 $mdToast.show(

                                     $mdToast.simple()
                                         .textContent( 'Podczas odrzucania aplikacji wystąpił błąd! Spróbuj ponownie.' )
                                         .position( 'bottom right' )
                                         .hideDelay( 5000 )

                                    );

                                 }

                            );

                        }

                break; }

            }

        };

    $scope.AcceptApplication = function ( application, event ) {

        for ( let i = 0; i < $scope.applications.length; i++ ) {

            if ( $scope.applications[i].id == application.id ) {
                
                if ( !$scope.applications[i].member ) {

                    let Dialog = $mdDialog.prompt()
            
                        .title( 'Przyjmij aplikację' )
                        .textContent( 'Zaraz przyjmiesz aplikację danego użytkownika. Napisz dla niego krótką wiadomość powitalną.' )
                        .placeholder( 'Wiadomość powitalna' )
                        .ariaLabel( 'Przyjmij aplikację' )
                        .initialValue( '' )
                        .targetEvent( event )
                        .ok( 'Przyjmij' )
                        .cancel( 'Anuluj' );

                    $mdDialog.show( Dialog ).then(
            
                        function ( response ) {

                            $http.post( server.url + server.api + "/recruitment/accept_role?hash=" + $scope.ProjectHash, {
            
                                id: $scope.applications[i].id,
                                role: application.role.title,
                                
                                response: {

                                    title: "Przyjęto twoją aplikację",
                                    text: "Lider zespołu przyjął twoją aplikację. Na powitanie napisał ci:\n\n" + response

                                    }

                                } ).then(

                                    function ( subresponse ) {

                                        $scope.applications[i].accepted[ $scope.applications[i].roles.indexOf( application.role.title ) ] = true;
                                        $scope.applications[i].member = true;
                                        $scope.Members.push( { name: application.name, surname: application.surname, id: application.id } );

                                        if ( $scope.Role == application.role.title ) {

                                            $scope.ShowRole( application.role ); }

                                        },

                                    function ( subresponse ) { // TODO: TOAST

                                        console.log( "ERROR #" + subresponse.status + " IN ACCEPT_APPLICATION: " + subresponse.data );

                                        $mdToast.show(

                                            $mdToast.simple()
                                                .textContent( 'Podczas przyjmowania aplikacji wystąpił błąd! Spróbuj ponownie.' )
                                                .position( 'bottom right' )
                                                .hideDelay( 5000 )

                                            );

                                        }

                                    );

                            },

                        function ( ) {
                
                            // NOTHING
                
                            }
            
                        ); }

                else {

                    $http.post( server.url + server.api + "/recruitment/accept_role?hash=" + $scope.ProjectHash, {
            
                        id: $scope.applications[i].id,
                        role: application.role.title

                        } ).then(

                            function ( subresponse ) {

                                $scope.applications[i].accepted[ $scope.applications[i].roles.indexOf( application.role.title ) ] = true;

                                if ( $scope.Role == application.role.title ) {

                                    $scope.ShowRole( application.role ); }

                                },

                            function ( subresponse ) {

                                 console.log( "ERROR #" + subresponse.status + " IN ACCEPT_APPLICATION: " + subresponse.data );

                                 $mdToast.show(

                                     $mdToast.simple()
                                         .textContent( 'Podczas przyjmowania aplikacji wystąpił błąd! Spróbuj ponownie.' )
                                         .position( 'bottom right' )
                                         .hideDelay( 5000 )

                                    );

                                 }
                            );

                    }

                break; }

            }

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

        $http.get( server.url + server.api + "/recruitment?hash=" + $scope.ProjectHash ).then(
            
            function ( response ) {
                
                $scope.roles = response.data.roles;
                $scope.applications = response.data.applications;
                $scope.skills = response.data.skills;
                $scope.notifications = response.data.notifications;

                for ( let i = 0; i < $scope.roles.length; i++ ) {

                    if ( $scope.roles[i].title == 'Lider' ) {

                        $scope.roles.splice( i, 1 );

                        break;} }

                for ( let i = 0; i < $scope.applications.length; i++ ) {

                    if ( $scope.applications[i].member ) {

                        $scope.Members.push( { name: $scope.applications[i].name, surname: $scope.applications[i].surname, id: $scope.applications[i].id } ); } }

                for ( let i = 0; i < $scope.skills.length; i++ ) {

                    if ( $scope.skills[i].hash.substr( 0, 3 ) == "IST" ) {

                        $scope.skills.splice( i, 1 );

                        i--; } }

                if ( $scope.roles.length > 0 ) {

                    $scope.ShowRole( $scope.roles[0] ); }

                for ( let i = 0; i < $scope.notifications.length; i++ ) {

                    if ( $scope.notifications[i].seen == false ) {

                        $scope.NotificationsState = 3;

                        break; } }

                if ( response.data.tutorial ) {

                    $http.get( server.url + "/tutorials/recruitment.json" ).then(

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

    function RecruitmentRoleCreationController ( $scope, $mdDialog, server, project ) {

        $scope.SearchPhrase = "";

        $scope.Roles = project.roles;
        $scope.Skills = project.skills;

        $scope.Role = {

            title: "",
            description: "",
            skill: null

            };

        $scope.local = server.local;

        $scope.GetFilteredSkills = function ( ) {

            return $scope.Skills.filter(

                function ( skill ) {

                    return ( skill.title.match( new RegExp( $scope.SearchPhrase, 'i' ) ) != null ); }

                );

            };

        $scope.ImportRole = function ( ) {

            if ( ( $scope.Role.title == "" || $scope.Role.title === undefined ) && $scope.Role.skill != null ) {

                for ( let i = 0; i < $scope.Skills.length; i++ ) {

                    if ( $scope.Skills[i].hash == $scope.Role.skill.hash ) {

                        $scope.Role.title = $scope.Skills[i].role_title;

                        break; } } }

            if ( ( $scope.Role.description == "" || $scope.Role.description === undefined ) && $scope.Role.skill != null ) {

                for ( let i = 0; i < $scope.Skills.length; i++ ) {

                    if ( $scope.Skills[i].hash == $scope.Role.skill.hash ) {

                        $scope.Role.description = $scope.Skills[i].role_description;

                        break; } } }

            $scope.ValidateRole();

            };

        $scope.ValidateRole = function ( ) {

            for ( let i = 0; i < $scope.Roles.length; i++ ) {

                if ( $scope.Roles[i].title == $scope.Role.title ) {

                    $scope.DialogForm.title.$setValidity( "unique", false );

                    return; } }

            $scope.DialogForm.title.$setValidity( "unique", true );

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

    function RecruitmentRoleEditionController ( $scope, $mdDialog, server, project ) {

        $scope.Role = {

            skill: project.role.skill,
            title: project.role.title,
            description: project.role.description

            };

        $scope.Roles = project.roles;

        $scope.local = server.local;

        $scope.ValidateRole = function ( ) {

            for ( let i = 0; i < $scope.Roles.length; i++ ) {

                if ( $scope.Roles[i].title == $scope.Role.title ) {

                    $scope.DialogForm.title.$setValidity( "unique", false );

                    return; } }

            $scope.DialogForm.title.$setValidity( "unique", true );

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

    function RecruitmentInvolvementController ( $scope, $mdDialog, server, members ) {

        $scope.Members = members;
        $scope.Member = "";

        $scope.local = server.local;

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

    } ] );
