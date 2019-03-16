/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <[EMAIL]>, July 2017
 */

angular.module('Invity').requires.push('ui.bootstrap.datetimepicker');
moment.locale('pl');

Invity.controller( 'IndexController', [ '$scope', '$http', '$window', '$sce', '$mdDialog', '$mdSidenav', '$mdToast', '$mdMedia', 'server', function ( $scope, $http, $window, $sce, $mdDialog, $mdSidenav, $mdToast, $mdMedia, server ) {

    $scope.$mdMedia = $mdMedia;

    $scope.Redirect = function ( url ) {

        $window.location.href = url;

        };

    $scope.OpenNavigation = function ( ) {

        $mdSidenav('navigation').open();

        };

    $scope.CloseNavigation = function ( ) {

        $mdSidenav('navigation').close();

        };

    $scope.Login = function( event ) {

        $mdDialog.show( {

            controller: LoginDialogController,
            templateUrl: 'login.html',
            parent: angular.element( document.body ),
            targetEvent: event,
            clickOutsideToClose: false,
            disableParentScroll: false,
            fullscreen: true

            } ).then(
            
                function ( response ) {

                    $http.post( server.api + '/login', {

                        email: response.email,
                        password: response.password

                        } ).then(

                            function ( subresponse ) {

                                $window.location.href = 'profile.html'; // TODO: CHANGE TO COCKPIT

                                },

                            function ( subresponse ) {

                                console.log( "ERROR #" + subresponse.status + " IN LOGIN: " + subresponse.data );

                                $mdDialog.show(

                                    $mdDialog.alert ( )

                                        .title( 'Podczas logowania wystąpił błąd' )
                                        .textContent( subresponse.data )
                                        .ariaLabel( 'Podczas logowania wystąpił błąd' )
                                        .ok( 'Rozumiem' )
                                        .parent( angular.element( document.body ) )
                                        .targetEvent( event )
                                        .clickOutsideToClose( true )

                                        );

                                }

                            );

                    },

                function ( ) {

                    // NOTHING

                    }

                );

        };

    $scope.Register = function( event ) {

        $mdDialog.show( {

            controller: RegisterDialogController,
            templateUrl: 'register.html',
            parent: angular.element( document.body ),
            targetEvent: event,
            clickOutsideToClose: false,
            disableParentScroll: false,
            fullscreen: true

            } ).then(
                
                function ( response ) {

                    if ( !response.personaldata ) {

                        response.schoolname = "";
                        response.education = "";
                        response.city = "";
                        response.sex = "";

                        }

                    $http.post( server.api + '/register', {

                        name: response.name,
                        surname: response.surname,
                        
                        email: response.email,
                        password: response.password,

                        sex: response.sex,
                        birthdate: response.birthdate,

                        schoolname: response.schoolname,
                        education: response.education,
                        city: response.city

                        } ).then(
                        
                            function ( subresponse ) {
                                
                                $window.location.href = 'profile.html';

                                },

                            function ( subresponse ) {   

                                console.log( "ERROR #" + subresponse.status + " IN REGISTER: " + subresponse.data );

                                $mdDialog.show(
                                    
                                    $mdDialog.alert ( )
                                        
                                        .title( 'Podczas rejestracji wystąpił błąd' )
                                        .textContent( subresponse.data )
                                        .ariaLabel( 'Podczas rejestracji wystąpił błąd' )
                                        .ok( 'Rozumiem' )
                                        .parent( angular.element( document.body ) )
                                        .targetEvent( event )
                                        .clickOutsideToClose( true )
                                        
                                        );

                                }
                            
                            );

                        },

                function ( ) {

                    // NOTHING

                }

            );

        };

    function LoginDialogController( $scope, $mdDialog, server ) {

        $scope.ActiveTab = 1;

        $scope.user = {

            email: '',
            password: ''

            };

        $scope.hide = function() {

            $mdDialog.hide();

            };

        $scope.cancel = function() {

            $mdDialog.cancel();

            };

        $scope.Respond = function( response ) {

            $mdDialog.hide( response );

            };

        $scope.ValidateAndRespond = function ( response ) {

            if ( $scope.DialogForm.$valid ) {

                $scope.Respond( response ); }

            };

        }

    function RegisterDialogController( $scope, $mdDialog, server ) {

        $scope.ActiveTab = 1;
        $scope.Legal = false;
        $scope.Underage = true;
        $scope.AcceptPolicy = false;
        $scope.AcceptUnderage = false;

        $scope.user = {

            name: '',
            surname: '',
            sex: '',
            birthdate: new Date(),

            email: '',
            password: '',
            passwordrepeat: '',

            schoolname: '',
            education: '',
            city: '',

            personaldata: false

            };

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

            var TimeDifference = Date.now() - $scope.user.birthdate.getTime();
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

        $scope.hide = function ( ) {

            $mdDialog.hide();

            };

        $scope.cancel = function ( ) {

            $mdDialog.cancel();

            };

        $scope.Respond = function( response ) {

            $mdDialog.hide( response );

            };

        }

    } ] );


Invity.directive( 'onEnter', function ( ) {

    return function (scope, element, attrs) {

        element.bind("keydown keypress", function (event) {

            if( event.which === 13 ) {

                scope.$apply( function ( ) {

                    scope.$eval( attrs.onEnter );

                    } );

                event.preventDefault();

                }

            } );

        };

    } );
