/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

var Involve = angular.module( 'Involve', [ 'ngMessages', 'ngAnimate', 'ngSanitize', 'ngMaterial' ] );

Involve.constant( 'server', { url: "/static/", api: "../api", local: "", strict: false } );

Involve.config( function( $locationProvider ) {

    $locationProvider.html5Mode( {

        enabled: true,
        requireBase: false
        
        } );
    
    } );