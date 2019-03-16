/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

angular.module('Involve').requires.push('ui.bootstrap.datetimepicker');
moment.locale('pl');

Involve.controller( 'AboutController', [ '$scope', '$window', '$http', '$mdDialog', 'server', function ( $scope, $window, $http, $mdDialog, server ) {
    
    /*

    $scope.Video = {

        loaded: false

    };

    */

    $scope.local = server.local;

    $scope.Send = function ( ) {

        var InputName = document.getElementsByName( "name" )[0];
        var InputEmail = document.getElementsByName( "email" )[0];
        var InputMessage = document.getElementsByName( "message" )[0];

        if ( InputName.value == "" && InputEmail.value == "" && InputMessage.value == "" ) {

            return; }
        
        $http.post( server.url + server.api + '/contact', {
                        
            name: InputName.value,
            email: InputEmail.value,
            message: InputMessage.value
                        
            } ).then(

                function ( response ) {

                    InputName.value = "";
                    InputEmail.value = "";
                    InputMessage.value = "";

                    },

                function ( response ) {

                    // NOTHING

                    }

                );

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

                $http.post( server.url + server.api + '/login', {
                        
                        email: response.email,
                        password: response.password
                        
                        } ).then(
                            
                            function ( subresponse ) {

                                $window.location.href = server.local + 'cockpit.html';
                                
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

                    $http.post( server.url + server.api + '/register', {

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
                                
                                $window.location.href = server.local + 'cockpit.html';

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

        $scope.local = server.local;
        $scope.api = server.url + server.api;

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

        $scope.local = server.local;
        $scope.api = server.url + server.api;

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

Involve.directive( 'onEnter', function ( ) {

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

/*

Involve.directive( 'videoloader', function ( ) {

    return {

        scope: {

            VideoMeta: '=videometa'

        },

        link: function ( scope, element, attrs ) {

            if ( element[0].currentTime > 0.00 ) {

                scope.VideoMeta.loaded = true; }

            element.on( 'canplaythrough', function ( event ) {

                scope.VideoMeta.loaded = true;

                scope.$apply();

            } );

        }

    };

} );

Involve.directive( "fullscreen", function ( $window ) {

    return function ( scope, element, attrs ) {

        var AspectRatio = attrs.width / attrs.height;

        scope.Width = AspectRatio * window.innerHeight;
        scope.Height = window.innerHeight;
        scope.ShiftX = ( scope.Width - window.innerWidth ) / 2;
        scope.ShiftY = 0;

        if ( scope.Width < window.innerWidth ) {

            scope.Width = window.innerWidth;
            scope.Height = ( 1 / AspectRatio ) * window.innerWidth;
            scope.ShiftX = 0;
            scope.ShiftY = ( scope.Height - window.innerHeight ) / 2; }

    };

} );

Involve.directive( "scroll", function ( $window ) {

    return function ( scope, element, attrs ) {

        angular.element( $window ).bind( "scroll", function ( ) {

            if ( this.pageYOffset <= ( 0.1 * this.innerHeight ) ) {

                scope.Scroll = 0; }

            else if ( this.pageYOffset > ( 0.1 * this.innerHeight ) && this.pageYOffset < ( 1.0 * this.innerHeight ) ) {

                scope.Scroll = Math.floor( ( this.pageYOffset - ( 0.1 * this.innerHeight ) ) / ( 0.9 * this.innerHeight ) * 100 ); }

            else if ( this.pageYOffset >= ( 1.0 * this.innerHeight ) ) {

                scope.Scroll = 100; }

            scope.$apply();

        } );

    };

} );

*/