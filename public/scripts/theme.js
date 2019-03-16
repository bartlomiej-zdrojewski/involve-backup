/* Copyright (C) Bartłomiej Zdrojewski - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bartłomiej Zdrojewski <bartlomiej.zdrojewski@invity.space>, July 2017
 */

Involve.config( function( $mdThemingProvider ) {

    var InvolvePrimaryPalette = {

        '50': '#ACD5E5',
        '100': '#99CBDF',
        '200': '#85C1D9',
        '300': '#72B7D3',
        '400': '#5EADCD',
        '500': '#4BA3C7',
        '600': '#3B98BE',
        '700': '#3588AA',
        '800': '#2F7897',
        '900': '#296983',
        'A100': '#C0DFEB',
        'A200': '#D3E9F1',
        'A400': '#E7F3F7',
        'A700': '#235970',

        'contrastDefaultColor': 'light',
        'contrastDarkColors': undefined,
        'contrastLightColors': undefined,
        'contrastStrongLightColors': [ '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', 'A100', 'A200', 'A400', 'A700' ]

        };

    var InvolveAccentPalette = {

        '50': '#232323',
        '100': '#303030',
        '200': '#3D3D3D',
        '300': '#4A4A4A',
        '400': '#565656',
        '500': '#636363',
        '600': '#7D7D7D',
        '700': '#898989',
        '800': '#969696',
        '900': '#A3A3A3',
        'A100': '#7D7D7D',
        'A200': '#707070',
        'A400': '#636363',
        'A700': '#B0B0B0',

        'contrastDefaultColor': 'light',
        'contrastDarkColors': undefined,
        'contrastLightColors': undefined,
        'contrastStrongLightColors': [ '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', 'A100', 'A200', 'A400', 'A700' ]

        };

    $mdThemingProvider.definePalette( 'InvolvePrimaryPalette', InvolvePrimaryPalette );
    $mdThemingProvider.definePalette( 'InvolveAccentPalette', InvolveAccentPalette );

    $mdThemingProvider
        .theme( 'default' )
        .primaryPalette( 'InvolvePrimaryPalette' )
        .accentPalette( 'InvolveAccentPalette' )
        .warnPalette( 'red' )
        .backgroundPalette( 'grey' )

    } );