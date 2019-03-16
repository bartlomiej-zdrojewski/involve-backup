/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.controller( 'HeaderController', [ '$scope', '$location', '$http', 'server', function ( $scope, $location, $http, server ) {

    $scope.Title = "[PROJECT]";

    $scope.Setup = function ( ) {

        $scope.ProjectHash = $location.search().project;

        $http.get( server.url + server.api + "/project?hash=" + $scope.ProjectHash ).then(

            function ( response ) {

                $scope.Title = response.data.project.title;

                },

            function ( response ) {

                console.log( "ERROR #" + response.status + " IN SETUP: " + response.data );
                
                }
                
            );

        };

    } ] );

Involve.controller( 'ProjectController', [ '$scope', '$window', '$location', '$http', '$interval', '$sce', '$mdDialog', '$mdToast', 'server', function ( $scope, $window, $location, $http, $interval, $sce, $mdDialog, $mdToast, server ) {

    $scope.Mentor = false;
    $scope.Leader = false;
    $scope.Member = false;
    $scope.Favourite = false;
    $scope.Recruitment = false;
    $scope.Invited = false;
    $scope.Applied = false;

    $scope.Response = {
        
        title: "",
        text: ""

        };

    $scope.Title = "";
    $scope.Depiction = "";
    $scope.Description = "";
    $scope.Image = "";

    $scope.DescriptionActive = false;
    $scope.DescriptionIcon = "project-settings.svg";

    $scope.RolesWidth = 10000;

    $scope.ActionsMenuState = false;
    $scope.MemberActionsMenuState = false;
    $scope.InvitationState = 0;
    $scope.Tutorial = {};
    $scope.TutorialData = {};
    $scope.TutorialLength = 0;
    $scope.TutorialState = 0;
    $scope.NotificationsState = 0;

    $scope.media = [];
    $scope.roles = [];
    $scope.notifications = [];
    $scope.overview = [];

    $scope.local = server.local;

    $scope.SliceLink = function ( prefix, text ) {

        return text.substr( prefix.length, text.length - prefix.length );

        };

    $scope.NormalizeLink = function ( prefix, text ) {

        if ( prefix.substr( 0, 4 ) == "http" && prefix.substr( 0, 5 ) != "https" ) {

            if ( text.substr( 0, 5 ) == "https" ) {

                text = "http" + text.substr( 5, text.length - 5 ); } }

        if ( prefix.substr( 0, 5 ) == "https" ) {

            if ( text.substr( 0, 4 ) == "http" && text.substr( 0, 5 ) != "https" ) {

                text = "https" + text.substr( 4, text.length - 4 ); } }

        var Shift = 0;

        while ( text.length < prefix.length ) {

            text = text + " "; }

        while ( Shift < prefix.length ) {

            if ( text.substr( 0, prefix.length - Shift ) == prefix.substr( Shift, prefix.length - Shift ) ) {

                break; }

            Shift++; }

        text = prefix.substr( 0, Shift ) + text;

        while ( text[ text.length - 1 ] == " " ) {

            text = text.substr( 0, text.length - 1 ); }

        return text;

        };
/*
    $scope.GetScrollbarSize = function ( ) {
        
        var OuterContainer = document.createElement( "div" );

        OuterContainer.style.visibility = "hidden";
        OuterContainer.style.width = "100px";
        OuterContainer.style.msOverflowStyle = "scrollbar";

        document.body.appendChild( OuterContainer );

        var OuterContainerSize = OuterContainer.offsetWidth;

        OuterContainer.style.overflow = "scroll";

        var InnerContainer = document.createElement( "div" );

        InnerContainer.style.width = "100%";

        OuterContainer.appendChild( InnerContainer );        

        var InnerContainerSize = InnerContainer.offsetWidth;

        OuterContainer.parentNode.removeChild( OuterContainer );

        return ( OuterContainerSize - InnerContainerSize ); }

    $scope.$on( 'RepeatFinish', function( RepeatFinishEvent ) {

        var Width = 0;
        var Roles = document.getElementsByName( 'role' );
        var RolesContainer = document.getElementById( 'Roles' );

        for ( let i = 0; i < Roles.length; i++ ) {
            
            Roles[i].style.width = ( ( Math.floor( Roles[i].clientHeight + 1 ) - 30 ) + 300 + 15 * 3 + 1 ) + "px";

            Width = Width + ( Math.floor( Roles[i].clientHeight + 1 ) - 30 ) + 300 + 15 * 3 + 2; }

        Width = Width + ( Roles.length - 1 ) * 15 + 3;

        if ( RolesContainer.clientWidth >= ( Width + 6 ) ) {

            if ( RolesContainer.clientWidth >= ( Width + Roles.length * $scope.GetScrollbarSize() + 6 ) ) {

                for ( let i = 0; i < Roles.length; i++ ) {

                    Roles[i].style.width = ( ( Math.floor( Roles[i].clientHeight + 1 ) - 30 + $scope.GetScrollbarSize() ) + 300 + 15 * 3 + 1 ) + "px"; }

                Width = Width + Roles.length * 11; }

            else {

                Width = ( RolesContainer.clientWidth - 3 + 1 ); } }

        $scope.RolesWidth = Width;

        } );
*/
    $scope.Apply = function ( event ) {

        // Invitation states:
        // 0 - hidden
        // 1 - about to glow
        // 2 - glowing

        $scope.InvitationState = 0;

        var Application = {

            invited: $scope.Invited,
            roles: []

            };

        for ( let i = 0; i < $scope.roles.length; i++ ) {
            
            if ( $scope.roles[i].recruitment ) {

                Application.roles.push( $scope.roles[i].title ); } }

        $mdDialog.show( {

            controller: ProjectApplicationController,
            templateUrl: 'project-application.html',
            parent: angular.element( document.body ),
            locals: { application : Application },
            targetEvent: event,
            clickOutsideToClose: true,
            fullscreen: true

            } )

        .then(

            function ( response ) {

                if ( $scope.Invited ) {

                    $scope.Invited = false;

                    var Accepted = response.accepted;

                    if ( Accepted ) {

                        $scope.Applied = true; }

                    var Roles = [];

                    for ( let i = 0; i < response.roles.length; i++ ) {

                        if ( response.choice[i] ) {
                            
                            Roles.push( response.roles[i] ); } }

                    $http.post( server.url + server.api + "/application?hash=" + $scope.ProjectHash, {

                        invited: true,
                        invitationaccepted: Accepted,

                        explanation: response.explanation,
                        roles: Roles
                        
                        } ).then(

                            function ( subresponse ) {

                                $mdToast.show(

                                    $mdToast.simple()
                                        .textContent( 'Aplikacja została wysłana!' )
                                        .position( 'bottom right' )
                                        .hideDelay( 3000 )

                                    );

                                },

                            function ( subresponse ) {

                                console.log( "ERROR #" + subresponse.status + " IN APPLY: " + subresponse.data );

                                $mdToast.show(

                                    $mdToast.simple()
                                        .textContent( 'Podczas wysyłania aplikacji wystąpił błąd! Spróbuj ponownie.' )
                                        .position( 'bottom right' )
                                        .hideDelay( 5000 )

                                    );

                                }
                
                            );

                    }

                else {

                    $scope.Applied = true;

                    var Roles = [];

                    for ( let i = 0; i < response.roles.length; i++ ) {

                        if ( response.choice[i] ) {
                            
                            Roles.push( response.roles[i] ); } }

                    $http.post( server.url + server.api + "/application?hash=" + $scope.ProjectHash, {

                        invited: false,
                        invitationaccepted: false,

                        explanation: response.explanation,
                        roles: Roles

                        } ).then(

                            function ( subresponse ) {

                                $mdToast.show(

                                    $mdToast.simple()
                                        .textContent( 'Aplikacja została wysłana!' )
                                        .position( 'bottom right' )
                                        .hideDelay( 3000 )

                                    );

                                },

                            function ( subresponse ) {

                                console.log( "ERROR #" + subresponse.status + " IN APPLY: " + subresponse.data );

                                $mdToast.show(

                                    $mdToast.simple()
                                        .textContent( 'Podczas wysyłania aplikacji wystąpił błąd! Spróbuj ponownie.' )
                                        .position( 'bottom right' )
                                        .hideDelay( 5000 )

                                    );

                                }

                            );

                    }

                },

            function ( response ) {

                // NOTHING

                }

            ); 

        };

    $scope.AskToCloseProject = function ( event ) {

        var Dialog = $mdDialog.prompt()

            .title( 'Zakończ projekt' )
            .textContent( 'Projekt zostanie zakończony i oceniony przez mentora. Krótko uzasadnij powód zakończenia.' )
            .placeholder( 'Powód zakończenia' )
            .ariaLabel( 'Zakończ projekt' )
            .initialValue( '' )
            .targetEvent( event )
            .ok( 'Zakończ projekt' )
            .cancel( 'Anuluj' );

        $mdDialog.show( Dialog ).then(

            function ( response ) {

                $http.post( server.url + server.api + "/project/closure_request?hash=" + $scope.ProjectHash, {

                    explanation: response

                } ).then(

                    function ( subresponse ) {

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Prośba o zakończenie projektu została wysłana!' )
                                .position( 'bottom right' )
                                .hideDelay( 3000 )

                            );

                        },

                    function ( subresponse ) {

                        console.log( "ERROR #" + subresponse.status + " IN REPORT_PROJECT: " + subresponse.data );

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Podczas wysyłania prośby o zakończenie projektu wystąpił błąd! Spróbuj ponownie.' )
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

    $scope.CloseProject = function ( event ) {

        $mdDialog.show( {

            controller: ProjectClosureController,
            templateUrl: 'project-closure.html',
            parent: angular.element( document.body ),
            locals: { explanation: $scope.Closure.explanation },
            targetEvent: event,
            clickOutsideToClose: false,
            fullscreen: true

            } )

            .then(

                function ( response ) {

                    $http.post( server.url + server.api + "/project/close?hash=" + $scope.ProjectHash, {

                        agreement: response.agreement,
                        success: response.success,
                        summary: response.summary

                        } ).then(

                            function ( subresponse ) {

                                $window.location.href = server.local + 'cockpit.html';

                                },

                            function ( subresponse ) {

                                console.log( "ERROR #" + subresponse.status + " IN CLOSE_PROJECT: " + subresponse.data );

                                $mdToast.show(

                                    $mdToast.simple()
                                        .textContent( 'Podczas kończenia projektu wystąpił błąd! Spróbuj ponownie.' )
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

    $scope.ShowResponse = function ( event ) {

        if ( $scope.Response.title.length == 0 && $scope.Response.text.length == 0 ) {

            return; }

        $mdDialog.show( {
            
            controller: ProjectResponseController,
            templateUrl: 'project-response.html',
            parent: angular.element( document.body ),
            locals: { response: $scope.Response },
            targetEvent: event,
            clickOutsideToClose: false,
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

    $scope.UpdateFavourite = function ( ) {
        
        $http.get( server.url + server.api + "/favourite?hash=" + $scope.ProjectHash + "&value=" + ( !$scope.Favourite ? "true" : "false" ) ).then(

            function ( response ) {

                $scope.Favourite = !$scope.Favourite;

                },

            function ( response ) {

                console.log( "ERROR #" + response.status + " IN UPDATE_FAVOURITE: " + response.data );

                if ( $scope.Favourite ) {

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Podczas usuwania projektu z ulubionych wystąpił błąd! Spróbuj ponownie.' )
                            .position( 'bottom right' )
                            .hideDelay( 5000 )

                        );

                    }

                else {

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Podczas dodawania projektu do ulubionych wystąpił błąd! Spróbuj ponownie.' )
                            .position( 'bottom right' )
                            .hideDelay( 5000 )

                        );

                    }

                }

            );

        };

    $scope.ReportProject = function ( event ) {

        var Dialog = $mdDialog.prompt()

            .title( 'Zgłoś projekt' )
            .textContent( 'Projekt zostanie zgłoszony jako nieadekwatny. Krótko uzasadnij powód zgłoszenia.' )
            .placeholder( 'Uzasadnienie zgłoszenia' )
            .ariaLabel( 'Zgłoś projekt' )
            .initialValue( '' )
            .targetEvent( event )
            .ok( 'Wyślij' )
            .cancel( 'Anuluj' );

        $mdDialog.show( Dialog ).then(

            function ( response ) {

                $http.post( server.url + server.api + "/project/report?hash=" + $scope.ProjectHash, {

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

                            console.log( "ERROR #" + subresponse.status + " IN REPORT_PROJECT: " + response.data );

                            $mdToast.show(

                                $mdToast.simple()
                                    .textContent( 'Podczas wysyłania zgłoszenia wystąpił błąd! Spróbuj ponownie.' )
                                    .position( 'bottom right' )
                                    .hideDelay( 5000 )

                                );

                            } );

                },

            function ( ) {

                // NOTHING

                }

            );

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
            url: server.url + server.api + "/project/picture?hash=" + $scope.ProjectHash,
            
            headers: { 'Content-Type': undefined },
            transformRequest: angular.identity,

            data: Form

            } ).then(
                
                function ( response ) {

                    $scope.Image = response.data.image + "?rand=" + ( Math.random() % 10000 );

                    },
                
                function ( response ) {

                    console.log( "ERROR #" + response.status + " IN UPLOAD_FILE: " + response.data );

                    $mdDialog.show(

                        $mdDialog.alert ( )

                            .clickOutsideToClose( true )
                            .title( 'Zdjęcie nie zostało zaktualizowane' )
                            .textContent( 'Serwer nie był w stanie zaktualizować zdjęcia projektu. Spróbuj ponownie później.' )
                            .ariaLabel( 'Zdjęcie nie zostało zaktualizowane' )
                            .ok( 'Rozumiem' )
                            .targetEvent( event )

                        );

                    }
                
                );

        };

    $scope.AddMedium = function ( event ) {

        $mdDialog.show( {
            
            controller: ProjectMediumController,
            templateUrl: 'project-medium.html',
            parent: angular.element( document.body ), 
            targetEvent: event,
            clickOutsideToClose: true,
            fullscreen: true
            
            } )
        
       .then( 
            
            function ( response ) {

                let Medium = {

                    title: "",

                    link: "",
                    icon: ""

                    };
                
                switch ( response.site ) {

                    case "website" : {

                        Medium.title = $scope.SliceLink( "http://", $scope.NormalizeLink( "http://", response.path ) );
                        Medium.link = $scope.NormalizeLink( "http://", response.path );
                        Medium.icon = "icon-" + response.site + ".svg";

                        break; }

                    case "facebook" : {

                        Medium.title = $scope.SliceLink( "https://facebook.com", $scope.NormalizeLink( "https://facebook.com/", response.path ) );
                        Medium.link = $scope.NormalizeLink( "https://facebook.com/", response.path );
                        Medium.icon = "icon-" + response.site + ".svg";

                        break; }

                    case "google-plus" : {

                        Medium.title = $scope.SliceLink( "https://plus.google.com", $scope.NormalizeLink( "https://plus.google.com/", response.path ) );
                        Medium.link = $scope.NormalizeLink( "https://plus.google.com/", response.path );
                        Medium.icon = "icon-" + response.site + ".svg";

                        break; }

                    case "medium" : {

                        Medium.title = $scope.SliceLink( "https://medium.com/", $scope.NormalizeLink( "https://medium.com/@", response.path ) );
                        Medium.link = $scope.NormalizeLink( "https://medium.com/@", response.path );
                        Medium.icon = "icon-" + response.site + ".svg";

                        break; }

                    case "instagram" : {

                        Medium.title = $scope.SliceLink( "https://instagram.com", $scope.NormalizeLink( "https://instagram.com/", response.path ) );
                        Medium.link = $scope.NormalizeLink( "https://instagram.com/", response.path );
                        Medium.icon = "icon-" + response.site + ".svg";

                        break; }

                    case "twitter" : {

                        Medium.title = $scope.SliceLink( "https://twitter.com", $scope.NormalizeLink( "https://twitter.com/", response.path ) );
                        Medium.link = $scope.NormalizeLink( "https://twitter.com/", response.path );
                        Medium.icon = "icon-" + response.site + ".svg";

                        break; }

                    case "youtube" : {

                        Medium.title = $scope.SliceLink( "https://youtube.com/user", $scope.NormalizeLink( "https://youtube.com/user/", response.path ) );
                        Medium.link = $scope.NormalizeLink( "https://youtube.com/user/", response.path );
                        Medium.icon = "icon-" + response.site + ".svg";

                        break; }

                    case "snapchat" : {

                        Medium.title = $scope.SliceLink( "https://snapchat.com/add", $scope.NormalizeLink( "https://snapchat.com/add/", response.path ) );
                        Medium.link = $scope.NormalizeLink( "https://snapchat.com/add/", response.path );
                        Medium.icon = "icon-" + response.site + ".svg";

                        break; }

                    case "periscope" : {

                        Medium.title = $scope.SliceLink( "https://periscope.tv", $scope.NormalizeLink( "https://periscope.tv/", response.path ) );
                        Medium.link = $scope.NormalizeLink( "https://periscope.tv/", response.path );
                        Medium.icon = "icon-" + response.site + ".svg";

                        break; }

                    case "kickstarter" : {

                        Medium.title = $scope.SliceLink( "https://kck.st", $scope.NormalizeLink( "https://kck.st/", response.path ) );
                        Medium.link = $scope.NormalizeLink( "https://kck.st/", response.path );
                        Medium.icon = "icon-" + response.site + ".svg";

                        break; }

                    case "paypal" : {

                        Medium.title = $scope.SliceLink( "https://paypal.me", $scope.NormalizeLink( "https://paypal.me/", response.path ) );
                        Medium.link = $scope.NormalizeLink( "https://paypal.me/", response.path );
                        Medium.icon = "icon-" + response.site + ".svg";

                        break; }

                    }

                /*

                let seekedIndex = -1;
                $scope.media.forEach(function (el, index, array) {
                    let isEqual = true;
                    for(let prop in el)
                        if(el.hasOwnProperty(prop)) {
                            if(el[prop] !== Medium[prop])isEqual = false;
                        }
                    if(isEqual) seekedIndex = index;
                });

               */

                let Exists = false;

                for ( let i = 0; i < $scope.media.length; i++ ) {

                    if ( Medium.link == $scope.media[i].link ) {

                        Exists = true;

                        break; } }

                if ( Exists ) {

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Podane medium zostało już wcześniej dodane!' )
                            .position( 'bottom right' )
                            .hideDelay( 4000 )

                        );

                    return; }

                $scope.media.push( Medium );

                $http.post( server.url + server.api + '/project/media?hash=' + $scope.ProjectHash, {
                        
                    media: $scope.media
                        
                    } ).then(
                            
                        function ( response ) {

                            // NOTHING
                                
                            },

                        function ( response ) {

                            console.log( "ERROR #" + response.status + " IN ADD_MEDIUM: " + response.data );

                            $mdToast.show(

                                $mdToast.simple()
                                    .textContent( 'Podczas dodawania medium wystąpił błąd! Spróbuj ponownie.' )
                                    .position( 'bottom right' )
                                    .hideDelay( 5000 )

                                );

                            for ( let i = 0; i < $scope.media.length; i++ ) {

                                if ( Medium.link == $scope.media[i].link ) {

                                    $scope.media.splice( i, 1 );

                                    break; } }

                            }
                    
                        );

                },
                
            function ( ) {

                // NOTHING
                
                }
                
            );      
                    
        };

    $scope.DeleteMedium = function ( medium ) {

        let MediaCopy = angular.copy( $scope.media );

        for ( let i = 0; i < $scope.media.length; i++ ) {

            if ( medium.link == $scope.media[i].link ) {

                $scope.media.splice( i, 1 );

                break; } }

        $http.post( server.url + server.api + '/project/media?hash=' + $scope.ProjectHash, {
            
            media: $scope.media
                        
            } ).then(
                            
                function ( response ) {

                    // NOTHING

                    },

                function ( response ) {

                    console.log( "ERROR #" + response.status + " IN DELETE_MEDIUM: " + response.data );

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Podczas usuwania medium wystąpił błąd! Spróbuj ponownie.' )
                            .position( 'bottom right' )
                            .hideDelay( 5000 )

                        );

                    $scope.media = MediaCopy;

                    }
                    
                );

        };

    $scope.UpdateDescription = function ( ) {

        if ( $scope.DescriptionActive == true ) {

            $scope.DescriptionActive = false;
            $scope.DescriptionIcon = "project-settings.svg";

            $http.post( server.url + server.api + '/project/description?hash=' + $scope.ProjectHash, {
                
                description: $scope.Description
                        
                } ).then(
                            
                    function ( response ) {

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Szczegółowy opis został zaktualizowany!' )
                                .position( 'bottom right' )
                                .hideDelay( 3000 )

                            );
                                
                        },

                    function ( response ) {

                        console.log( "ERROR #" + response.status + " IN DESCRIPTION_UPDATE: " + response.data );

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Podczas aktualizowania opisu wystąpił błąd! Spróbuj ponownie.' )
                                .position( 'bottom right' )
                                .hideDelay( 5000 )

                            );

                        }
                    
                    );

            }

        else if ( $scope.DescriptionActive == false ) {

            $scope.DescriptionActive = true;
            $scope.DescriptionIcon = "project-settings-save.svg";

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

                if ( $scope.InvitationState == 1 ) {

                    $scope.InvitationState = 2; }

                else if ( $scope.InvitationState == 2 ) {

                    $scope.InvitationState = 1; }

                if ( $scope.NotificationsState == 3 ) {

                    $scope.NotificationsState = 4; }

                else if ( $scope.NotificationsState == 4 ) {

                    $scope.NotificationsState = 3; }

            },

            1750 );

        $http.get( server.url + server.api + "/project?hash=" + $scope.ProjectHash ).then(

            function ( response ) {

                $scope.Mentor = response.data.mentor;
                $scope.Leader = response.data.leader;
                $scope.Member = response.data.member;
                $scope.Favourite = response.data.favourite;
                $scope.Recruitment = response.data.recruitment;
                $scope.Invited = response.data.invited;
                $scope.Applied = response.data.applied;
                $scope.Closure = response.data.closure;

                $scope.Response.title = response.data.response.title;
                $scope.Response.text = response.data.response.text;

                $scope.Title = response.data.project.title;
                $scope.Depiction = response.data.project.depiction;
                $scope.Description = response.data.project.description;
                $scope.Image = response.data.project.image;

                $scope.media = response.data.project.media;
                $scope.roles = response.data.project.roles;
                $scope.notifications = response.data.notifications;

                if ( $scope.Applied && !$scope.Member ) {

                    $scope.InvitationState = 1; }

                for ( let i = 0; i < $scope.roles.length; i++ ) {

                    if ( $scope.roles[i].members.length == 0 ) {

                        var OverviewElement = {

                            image: "absent.png",
                            titles: $scope.roles[i].title,
                            member: "Rekrutacja jest otwarta!",
                            contact: "",
                            description: ( "Do tej roli wymagana jest umiejętność:\n" + $scope.roles[i].skill + "\n\n" + $scope.roles[i].description )

                            };

                        $scope.overview.push( OverviewElement ); }

                    else {

                        for ( let j = 0; j < $scope.roles[i].members.length; j++ ) {

                            var Index = -1;

                            for ( let k = 0; k < $scope.overview.length; k++ ) {

                                if ( $scope.roles[i].members[j] == $scope.overview[k] ) {

                                    Index = k;

                                    break; } }

                            if ( Index != -1 ) {

                                $scope.overview[Index].titles = $scope.overview[Index].titles + "\n" + $scope.roles[i].title;
                                $scope.overview[Index].description = $scope.overview[Index].description + "\n\n" + $scope.roles[i].description; }

                            else {

                                var OverwievElement = {

                                    image: $scope.roles[i].members[j].avatar,
                                    titles: $scope.roles[i].title,
                                    member: $scope.roles[i].members[j].name,
                                    contact: $scope.roles[i].members[j].contact,
                                    description: $scope.roles[i].description

                                    };

                                $scope.overview.push( OverwievElement ); } } } }

                if ( $scope.Closure.state && $scope.Mentor ) {

                    $scope.CloseProject(); }

                else if ( $location.search().response == "true" ) {

                    $scope.ShowResponse(); }

                if ( $location.search().apply == "true" && !$scope.Member ) {

                    $scope.Apply(); }

                for ( let i = 0; i < $scope.notifications.length; i++ ) {

                    if ( $scope.notifications[i].seen == false ) {

                        $scope.NotificationsState = 3;

                        break; } }

                if ( response.data.tutorial ) {

                    $http.get( server.url + "/tutorials/project.json" ).then(

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
    
    function ProjectApplicationController ( $scope, $mdDialog, server, application ) {

        $scope.Application = {

            invited: application.invited,
            accepted: false,
            
            explanation: ( application.invited ? 'Użytkownik został zaproszony do projektu.' : '' ),
            roles: application.roles,
            choice: []

            };

        $scope.local = server.local;

        for ( let i = 0; i < $scope.Application.roles.length; i++ ) {

            $scope.Application.choice.push( true ); }
        
        $scope.hide = function ( ) {
            
            $mdDialog.hide();
            
            };

        $scope.cancel = function ( ) {
            
            $mdDialog.cancel();
            
            };

        $scope.CheckChoice = function ( ) {

            for ( let i = 0; i < $scope.Application.choice.length; i++ ) {

                if ( $scope.Application.choice[i] ) {
                
                    return true; } }

            return false;

            };

        $scope.Respond = function ( response ) {
            
            $mdDialog.hide( response );
            
            };
        
        }

    function ProjectClosureController ( $scope, $mdDialog, server, explanation ) {

        $scope.Explanation = explanation;

        $scope.Closure = {

            agreement: false,
            success: true,
            summary: ""

            };

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

    function ProjectMediumController ( $scope, $mdDialog, server ) {

        $scope.medium = {

            site: "",
            path: ""

            };

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
/*
Involve.directive( 'onRepeatFinish', function ( $timeout ) {

    return {

        restrict: 'A',
        link: function ( scope, element, attr ) {
            
            if ( scope.$last == true ) {

                $timeout( function ( ) {
                    
                    scope.$emit( attr.onRepeatFinish );
                    
                    } );

                }
            }
        } 
    
    } );
*/