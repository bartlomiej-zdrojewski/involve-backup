/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'SkillsController', [ '$scope', '$window', '$http', '$interval', '$sce', '$mdDialog', '$mdToast', 'server', function ( $scope, $window, $http, $interval, $sce, $mdDialog, $mdToast, server ) {

    $scope.Filters = [

        // CODE

        ];

    $scope.Categories = [

        // See 'https://material.io/guidelines/style/color.html' for more themes
        // Use 700 for theme, 600 for hover and 500 for active

        {
            title: "Istota projektu",
            icon: "default.svg",
            hash: "IST",

            theme: "#D32F2F",
            hover: "#E53935",
            active: "#F44336",
            font: "#FFFFFF"
        },

        {
            title: "Programowanie",
            icon: "default.svg",
            hash: "PRO",

            theme: "#1976D2",
            hover: "#1E88E5",
            active: "#2196F3",
            font: "#FFFFFF"
        },

        {
            title: "Mechanika",
            icon: "default.svg",
            hash: "MEC",

            theme: "#388E3C",
            hover: "#43A047",
            active: "#4CAF50",
            font: "#FFFFFF"
        },

        {
            title: "Design",
            icon: "default.svg",
            hash: "DES",

            theme: "#FFA000",
            hover: "#FFB300",
            active: "#FFC107",
            font: "#FFFFFF"
        },

        {
            title: "Copywriting",
            icon: "default.svg",
            hash: "COP",

            theme: "#C2185B",
            hover: "#D81B60",
            active: "#E91E63",
            font: "#FFFFFF"
        },

        {
            title: "Promocja",
            icon: "default.svg",
            hash: "PRM",

            theme: "#512DA8",
            hover: "#5E35B1",
            active: "#673AB7",
            font: "#FFFFFF"
        },

        {
            title: "Fundraising",
            icon: "default.svg",
            hash: "FUN",

            theme: "#00796B",
            hover: "#00897B",
            active: "#009688",
            font: "#FFFFFF"
        }

        ];

    $scope.Skills = [];

    $scope.Category = "";
    $scope.CategoryHover = "";
    $scope.SkillsReady = 0;
    $scope.SkillsReadyPromise = {};
    $scope.SearchPhrase = "";
    $scope.SkillHover = "";
    $scope.SkillHoverPromise = {};
    $scope.Tutorial = {};
    $scope.TutorialData = {};
    $scope.TutorialLength = 0;
    $scope.TutorialState = 0;
    $scope.NotificationsState = 0;

    $scope.skills = [];
    $scope.projects = [];
    $scope.notifications = [];

    $scope.local = server.local;

    $scope.GetTheme = function ( category ) {

        var Theme = {

            color: category.font,
            backgroundColor: ""

            };

        if ( $scope.Category == category.hash ) {

            Theme.backgroundColor = category.active; }

        else if ( $scope.CategoryHover == category.hash ) {

            Theme.backgroundColor = category.hover; }

        else {

            Theme.backgroundColor = category.theme; }

        return Theme;

        };

    $scope.GradateColor = function ( base, delta, index, size ) {

        if ( size == 1 ) {

            return base; }

        var Red = parseInt( base.substr( 1, 2 ), 16 );
        var Green = parseInt( base.substr( 3, 2 ), 16 );
        var Blue = parseInt( base.substr( 5, 2 ), 16 );

        Red = Red + Math.floor( ( index / ( size - 1 ) - 0.5 ) * ( Red / 255 ) * delta );
        Green = Green + Math.floor( ( index / ( size - 1 ) - 0.5 ) * ( Green / 255 ) * delta );
        Blue = Blue + Math.floor( ( index / ( size - 1 ) - 0.5 ) * ( Blue / 255 ) * delta );

        if ( Red < 0 ) { Red = 0; }
        if ( Green < 0 ) { Green = 0; }
        if ( Blue < 0 ) { Blue = 0; }

        if ( Red > 255 ) { Red = 255; }
        if ( Green > 255 ) { Green = 255; }
        if ( Blue > 255 ) { Blue = 255; }

        Red = ( Red.toString( 16 ) + "0" ).substr( 0, 2 );
        Green = ( Green.toString( 16 ) + "0" ).substr( 0, 2 );
        Blue = ( Blue.toString( 16 ) + "0" ).substr( 0, 2 );

        return ( "#" + Red + Green + Blue );

        };

    $scope.ToggleCategoryHover = function ( hash ) {

        $scope.CategoryHover = hash;

        };

    $scope.ToggleSkillHover = function ( hash ) {

        $interval.cancel( $scope.SkillHoverPromise );

        $scope.SkillHoverPromise = $interval(

            function ( ) {

                $scope.SkillHover = hash;

                },

            50, 1 );

        };

    $scope.Filter = function ( category ) {

        if ( category !== undefined ) {

            $scope.Skills = [];
            $scope.Category = category.hash;
            $scope.SkillsReady = 0;
            $scope.SearchPhrase = "";

            $interval.cancel( $scope.SkillsReadyPromise );

            $scope.SkillsReadyPromise = $interval(

                function ( ) {

                    $scope.SkillsReady = 2;

                    $interval(

                        function ( ) {

                            var SearchInput = $window.document.getElementById( 'SearchInput' );

                            if( SearchInput ) {

                                SearchInput.focus(); }

                            },

                        50, 1 );

                    },

                750, 1 );

            for ( let i = 0; i < $scope.skills.length; i++ ) {

                if ( $scope.skills[i].hash.substr( 0, 3 ) == $scope.Category ) {

                    $scope.Skills.push( $scope.skills[i] ); } }

            $scope.Skills.sort(

                function ( a, b ) {

                    if ( a.level > b.level ) {

                        return -1; }

                    if ( a.level < b.level ) {

                        return 1; }

                    if ( a.hash.length < b.hash.length ) {

                        return -1; }

                    if ( a.hash.length > b.hash.length ) {

                        return 1; }

                    if ( a.title < b.title ) {

                        return -1; }

                    if ( a.title > b.title ) {

                        return 1; }

                    return 0; }

                );

            for ( let i = 0; i < $scope.Skills.length; i++ ) {

                $scope.Skills[i].visible = true;
                $scope.Skills[i].theme = $scope.GradateColor( category.hover, 50, $scope.Skills.length - ( i + 1 ), $scope.Skills.length );
                $scope.Skills[i].font = category.font; }

            }

        else {

            $scope.SkillsReady = 1;

            $interval.cancel( $scope.SkillsReadyPromise );

            $scope.SkillsReadyPromise = $interval(

                function ( ) {

                    $scope.SkillsReady = 2;

                    },

                500, 1 );

            // FILTERS

            if ( $scope.SearchPhrase.length >= 3 ) {

                for ( let i = 0; i < $scope.Skills.length; i++ ) {

                    $scope.Skills[i].visible = false;

                    if ( $scope.Skills[i].title.toLowerCase().indexOf( $scope.SearchPhrase.toLowerCase() ) != -1 ) {

                        $scope.Skills[i].visible = true; }

                    if ( $scope.Skills[i].description.toLowerCase().indexOf( $scope.SearchPhrase.toLowerCase() ) != -1 ) {

                        $scope.Skills[i].visible = true; } } }

            else {

                for ( let i = 0; i < $scope.Skills.length; i++ ) {

                    $scope.Skills[i].visible = true; } }

            }

        };

    $scope.AssignRole = function ( skill ) {

        var Assignment = {

            skill: skill.title,
            projects: $scope.projects,

            role_title: skill.role_title,
            role_description: skill.role_description

            };

        $mdDialog.show( {

            controller: SkillsAssignmentController,
            templateUrl: 'skills-role-assignment.html',
            parent: angular.element( document.body ),
            locals: { assignment: Assignment },
            targetEvent: event,
            clickOutsideToClose: false,
            fullscreen: true

            } )

        .then(

            function ( response ) {

                $http.post( server.url + server.api + "/recruitment/create_role?hash=" + response.project, {

                    title: response.title,
                    description: response.description,
                    skill: hash

                    } ).then(

                        function ( subresponse ) {

                            $mdToast.show(

                                $mdToast.simple()
                                    .textContent( 'Rola została dodana do projektu!' )
                                    .position( 'bottom right' )
                                    .hideDelay( 3000 )

                                );

                            },

                        function ( subresponse ) {

                            console.log( "ERROR #" + subresponse.status + " IN ASSIGN_SKILL: " + subresponse.data );

                            $mdToast.show(

                                $mdToast.simple()
                                    .textContent( 'Podczas dodawania roli do projektu wystąpił błąd! Spróbuj ponownie.' )
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

    $scope.SetKnowledgeLevel = function ( hash, level ) {

        var PerviousLevel = 0;

        for ( let i = 0; i < $scope.Skills.length; i++ ) {

            if ( $scope.Skills[i].hash == hash ) {

                PerviousLevel = $scope.Skills[i].level;
                $scope.Skills[i].level = level;

                break; } }

        $http.post( server.url + server.api + "/node/level", {

            hash: hash,
            level: level

            } ).then(

                function ( response ) {

                    for ( let i = 0; i < $scope.skills.length; i++ ) {

                        if ( $scope.skills[i].hash == hash ) {

                            $scope.skills[i].level = level;

                            break; } }

                    },

                function ( response ) {

                    console.log( "ERROR #" + response.status + " IN SET_KNOWLEDGE_LEVEL: " + response.data );

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Podczas zmainy poziomu umiejętności wystąpił błąd! Spróbuj ponownie.' )
                            .position( 'bottom right' )
                            .hideDelay( 5000 )

                        );

                    $scope.Skills[i].level = PerviousLevel;

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

        $http.get( server.url + server.api + "/nodes" ).then(

            function ( response ) {

                $scope.skills = response.data.skills;
                $scope.projects = response.data.projects;
                $scope.notifications = response.data.notifications;

                $scope.projects.sort(

                    function ( a, b ) {

                        if ( a.leader > b.leader ) {

                            return -1; }

                        if ( a.leader < b.leader ) {

                            return 1; }

                        if ( a.title < b.title ) {

                            return -1; }

                        if ( a.title > b.title ) {

                            return 1; }

                        return 0; }

                    );

                for ( let i = 0; i < $scope.notifications.length; i++ ) {

                    if ( $scope.notifications[i].seen == false ) {

                        $scope.NotificationsState = 3;

                        break; } }

                if ( response.data.tutorial ) {

                    $http.get( server.url + "/tutorials/skills.json" ).then(

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

    function SkillsAssignmentController ( $scope, $mdDialog, server, assignment ) {

        $scope.ActiveTab = 1;

        $scope.Skill = assignment.skill;
        $scope.Projects = assignment.projects;

        $scope.Assignment = {

            project: "",

            title: $scope.Skill.role_title,
            description: $scope.Skill.role_description

            };

        $scope.local = server.local;

        $scope.SelectProject = function ( hash ) {

            $scope.ActiveTab = 2;
            $scope.Assignment.project = hash;

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

    } ] );

