/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

angular.module('Involve').requires.push('ui.bootstrap.datetimepicker');
moment.locale('pl');

Involve.controller( 'RegisterCompletionController', [ '$scope', '$window', '$http', '$mdDialog', 'server', function ( $scope, $window, $http, $mdDialog, server ) {

    $scope.ActiveTab = 1;
    $scope.Legal = false;
    $scope.Underage = true;
    $scope.AcceptUnderage = false;

    $scope.Account = {

        email: '',

        name: '',
        surname: '',
        sex: '',
        birthdate: new Date(),

        schoolname: '',
        education: '',
        city: '',

        personaldata: false

        };

    $scope.local = server.local;

    $scope.FilterDates = function ( $dates ) {

        var Today = new Date();
        Today.setUTCHours(0);

        var DistantPast = new Date();
        DistantPast.setFullYear( Today.getFullYear() - 201 );

        for ( let i = 0; i < $dates.length; i++ ) {

            if ( $dates[i].utcDateValue < DistantPast || $dates[i].utcDateValue > Today ) {

                $dates[i].selectable = false; } }

        };

    $scope.VerifyAge = function ( ) {

        var TimeDifference = Date.now() - $scope.Account.birthdate.getTime();
        var AgeAsDate = new Date( TimeDifference );

        if ( Math.abs( AgeAsDate.getFullYear() - 1970 ) < 13 ) {

            $scope.Legal = false;
            $scope.Underage = true;
            $scope.AcceptUnderage = false; }

        else if ( Math.abs( AgeAsDate.getFullYear() - 1970 ) < 18 ) {

            $scope.Legal = true;
            $scope.Underage = true;
            $scope.AcceptUnderage = false; }

        else {

            $scope.Legal = true;
            $scope.Underage = false;
            $scope.AcceptUnderage = true; }

        };

    $scope.Complete = function ( ) {

        if ( !$scope.Account.personaldata ) {

            $scope.Account.schoolname = "";
            $scope.Account.education = "";
            $scope.Account.city = "";
            $scope.Account.sex = "";

            }

        $http.post( server.url + server.api + '/register/complete', {

            email: $scope.Account.email,

            sex: $scope.Account.sex,
            birthdate: $scope.Account.birthdate,

            schoolname: $scope.Account.schoolname,
            education: $scope.Account.education,
            city: $scope.Account.city

            } ).then(

                function ( response ) {

                    $window.location.href = server.local + 'cockpit.html';

                    },

                function ( response ) {

                    console.log( "ERROR #" + response.status + " IN REGISTER: " + response.data );

                    $mdDialog.show(

                        $mdDialog.alert ( )

                            .title( 'Podczas kończenia rejestracji wystąpił błąd' )
                            .textContent( response.data )
                            .ariaLabel( 'Podczas kończenia rejestracji wystąpił błąd' )
                            .ok( 'Rozumiem' )
                            .parent( angular.element( document.body ) )
                            .targetEvent( event )
                            .clickOutsideToClose( true )

                        );

                    }

                );

        };

    $scope.Setup = function ( ) {

        $http.get( server.url + server.api + "/register/status" ).then(

            function ( response ) {

                if ( response.registered ) {

                    $window.location.href = server.local + 'cockpit.html'; }

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