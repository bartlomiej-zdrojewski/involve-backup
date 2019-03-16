/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'HeaderController', [ '$scope', '$location', '$http', 'server', function ( $scope, $location, $http, server ) {

    $scope.Title = "[CASE]";

    $scope.Setup = function ( ) {

        $scope.CaseHash = $location.search().case;

        $http.get( server.url + server.api + "/case?hash=" + $scope.CaseHash ).then(

            function ( response ) {

                $scope.Title = response.data.case.title;

                },

            function ( response ) {

                console.log( "ERROR #" + response.status + " IN SETUP: " + response.data );

                }

            );

        };

    } ] );

Involve.controller( 'CaseController', [ '$scope', '$window', '$location', '$http', '$interval', '$sce', '$mdDialog', '$mdToast', 'server', function ( $scope, $window, $location, $http, $interval, $sce, $mdDialog, $mdToast, server ) {

    $scope.Title = "";
    $scope.Brief = "";
    $scope.Preview = ""; // TEMP
    $scope.Skills = [];
    $scope.Tutorial = {};
    $scope.TutorialData = {};
    $scope.TutorialLength = 0;
    $scope.TutorialState = 0;
    $scope.NotificationsState = 0;

    $scope.skills = [];
    $scope.projects = [];
    $scope.available = [];
    $scope.notifications = [];

    $scope.local = server.local;

    $scope.RenderChart = function ( chart ) {

        var D3Box = document.getElementById( 'd3box' );

        if ( D3Box.clientWidth == 0 || D3Box.clientHeight == 0 ) {

            $interval(

                function ( ) {

                    $scope.RenderChart( chart );

                    },

                100, 1 );

            return; }

        else {

            D3Box.innerHTML = ""; }

        var Width = D3Box.clientWidth;
        var Height = D3Box.clientHeight;
        var Elements = chart;

        // D3JS ->

        for (var i in Elements)
            if (Elements.hasOwnProperty(i)) {
                Elements[i].label = Elements[i].title;
                Elements[i].value = Elements[i].part;
            }

        var pie = new d3pie("d3box", {
            "size": {
                "canvasWidth": Width,
                "canvasHeight": Height,
                "pieInnerRadius": "0%",
                "pieOuterRadius": "70%"
            },
            "data": {
                "sortOrder": "label-desc",
                "content": Elements
            },
            "labels": {
                "outer": {
                    "format": "none",
                    "pieDistance": 12
                },
                "inner": {
                    "format": "none"
                },
                "mainLabel": {
                    "font": "Roboto",
                    "fontSize": 14
                },
                "percentage": {
                    "color": "#ffffff",
                    "decimalPlaces": 0
                },
                "value": {
                    "color": "#adadad",
                    "fontSize": 13
                },
                "lines": {
                    "enabled": true
                },
                "truncation": {
                    "enabled": true
                }
            },
            "tooltips": {
                "enabled": true,
                "type": "placeholder",
                "string": "{label}: {percentage}%",
                "styles": {
                    "backgroundOpacity": 0.6
                }
            },
            "effects": {
                "pullOutSegmentOnClick": {
                    "effect": "linear",
                    "speed": 400,
                    "size": 8
                }
            },
            "misc": {
                "colors": {}
            }
        });

        // -> D3JS

        };

    $scope.CreateProject = function ( event ) {

        // CODE

        };

    $scope.AssignProject = function ( event ) {

        $mdDialog.show( {

            controller: ProjectAssignmentController,
            templateUrl: 'case-project-assignment.html',
            parent: angular.element( document.body ),
            locals: { projects: $scope.available },
            targetEvent: event,
            clickOutsideToClose: false,
            fullscreen: true

            } )

            .then(

                function ( response ) {

                    $http.post( server.url + server.api + "/case/assign_project", {

                        case: $scope.CaseHash,
                        project: response.hash

                        } ).then(

                            function ( subresponse ) {

                                response.member = true;
                                $scope.projects.push( response );

                                },

                            function ( subresponse ) {

                                console.log( "ERROR #" + subresponse.status + " IN ASSIGN_PROJECT: " + subresponse.data );

                                $mdToast.show(

                                    $mdToast.simple()
                                        .textContent( 'Podczas wiązania projektu z zadaniem wystąpił błąd! Spróbuj ponownie.' )
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

        $scope.CaseHash = $location.search().case;

        $interval(

            function ( ) {

                if ( $scope.NotificationsState == 3 ) {

                    $scope.NotificationsState = 4; }

                else if ( $scope.NotificationsState == 4 ) {

                    $scope.NotificationsState = 3; }

                },

            1750 );

        $http.get( server.url + server.api + "/case?hash=" + $scope.CaseHash ).then(

            function ( response ) {

                $scope.Title = response.data.case.title;
                $scope.Brief = $sce.trustAsHtml( response.data.case.brief );
                $scope.Preview = response.data.case.preview; // TEMP

                $scope.skills = response.data.skills;
                $scope.projects = response.data.projects;
                $scope.available = response.data.available;
                $scope.notifications = response.data.notifications;

                $scope.Skills = $scope.skills;

                var Categories = [ 0, 0, 0, 0, 0, 0, 0 ];
                var Order = [ 0, 1, 2, 3, 4, 5, 6 ];

                for ( let i = 0; i < $scope.Skills.length; i++ ) {

                    switch ( $scope.Skills[i].hash.substr( 0, 3 ) ) {

                        case "IST" : $scope.Skills[i].category = 0; $scope.Skills[i].color = "#FF1744"; Categories[0] += $scope.Skills[i].part; break;
                        case "PRO" : $scope.Skills[i].category = 1; $scope.Skills[i].color = "#00B0FF"; Categories[1] += $scope.Skills[i].part; break;
                        case "MEC" : $scope.Skills[i].category = 2; $scope.Skills[i].color = "#76FF03"; Categories[2] += $scope.Skills[i].part; break;
                        case "DES" : $scope.Skills[i].category = 3; $scope.Skills[i].color = "#FFC400"; Categories[3] += $scope.Skills[i].part; break;
                        case "COP" : $scope.Skills[i].category = 4; $scope.Skills[i].color = "#F50057"; Categories[4] += $scope.Skills[i].part; break;
                        case "PRM" : $scope.Skills[i].category = 5; $scope.Skills[i].color = "#D500F9"; Categories[5] += $scope.Skills[i].part; break;
                        case "FUN" : $scope.Skills[i].category = 6; $scope.Skills[i].color = "#1DE9B6"; Categories[6] += $scope.Skills[i].part; break;

                        default : $scope.Skills[i].color = "#000000"; break;

                    } }

                Order.sort(

                    function ( a, b ) {

                        if ( Categories[a] > Categories[b] ) {

                            return -1; }

                        if ( Categories[a] < Categories[b] ) {

                            return 1; }

                        return 0; }

                    );

                $scope.Skills.sort(

                    function ( a, b ) {

                        if ( a.category != b.category ) {

                            for ( let i = 0; i < Order.length; i++ ) {

                                if ( Order[i] == a.category ) {

                                    return -1; }

                                if ( Order[i] == b.category ) {

                                    return 1; } } }

                        if ( a.part > b.part ) {

                            return -1; }

                        if ( a.part < b.part ) {

                            return 1; }

                        if ( a.title < b.title ) {

                            return -1; }

                        if ( a.title > b.title ) {

                            return 1; }

                        return 0; }

                    );

                $scope.RenderChart( $scope.Skills );

                for ( let i = 0; i < $scope.notifications.length; i++ ) {

                    if ( $scope.notifications[i].seen == false ) {

                        $scope.NotificationsState = 3;

                        break; } }

                if ( response.data.tutorial ) {

                    $http.get( server.url + "/tutorials/case.json" ).then(

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

    function ProjectAssignmentController ( $scope, $mdDialog, server, projects ) {

        $scope.Projects = projects;

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