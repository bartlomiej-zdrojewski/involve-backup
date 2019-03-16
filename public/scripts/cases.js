/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'CasesController', [ '$scope', '$window', '$http', '$interval', '$sce', '$mdDialog', '$mdToast', 'server', function ( $scope, $window, $http, $interval, $sce, $mdDialog, $mdToast, server ) {

    $scope.Filters = [

        // CODE

        ];

    $scope.Cases = [];

    $scope.Case = "";
    $scope.CaseHover = "";
    $scope.Tutorial = {};
    $scope.TutorialData = {};
    $scope.TutorialLength = 0;
    $scope.TutorialState = 0;
    $scope.NotificationsState = 0;

    $scope.Title = "";
    $scope.Description = "";
    $scope.Requirements = "";
    $scope.Link = "";
    $scope.Hash = "";

    $scope.cases = [];
    $scope.notifications = [];

    $scope.local = server.local;

    $scope.Hover = function ( hash ) {

        $scope.CaseHover = hash;

        };

    $scope.Filter = function ( ) {

        // cases -> Cases

        };

    $scope.ShowCase = function ( _case ) {

        $scope.Case = _case.hash;
        $scope.Title = _case.title;
        $scope.Description = $sce.trustAsHtml( _case.description );
        $scope.Requirements = $sce.trustAsHtml( _case.requirements );
        $scope.Link = _case.link;
        $scope.Hash = _case.hash;

        $scope.RenderChart( _case.chart );

        };

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

        for ( let i = 0; i < Elements.length; i++ ) {

            switch ( Elements[i].hash.substr( 0, 3 ) ) {

                case "IST" : Elements[i].color = "#FF1744"; break;
                case "PRO" : Elements[i].color = "#00B0FF"; break;
                case "MEC" : Elements[i].color = "#76FF03"; break;
                case "DES" : Elements[i].color = "#FFC400"; break;
                case "COP" : Elements[i].color = "#F50057"; break;
                case "PRM" : Elements[i].color = "#D500F9"; break;
                case "FUN" : Elements[i].color = "#1DE9B6"; break;

                default : Elements[i].color = "#000000"; break;

                } }

        Elements.sort(

            function ( a, b ) {

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

        $http.get( server.url + server.api + "/cases" ).then(

            function ( response ) {

                $scope.cases = response.data.cases;
                $scope.notifications = response.data.notifications;

                $scope.cases.sort(

                    function ( a, b ) {

                        if ( a.priority > b.priority ) {

                            return -1; }

                        if ( a.priority < b.priority ) {

                            return 1; }

                        if ( a.title < b.title ) {

                            return -1; }

                        if ( a.title > b.title ) {

                            return 1; }

                        return 0; }

                    );

                $scope.Cases = $scope.cases;

                for ( let i = 0; i < $scope.notifications.length; i++ ) {

                    if ( $scope.notifications[i].seen == false ) {

                        $scope.NotificationsState = 3;

                        break; } }

                if ( response.data.tutorial ) {

                    $http.get( server.url + "/tutorials/cases.json" ).then(

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

        }

    } ] );