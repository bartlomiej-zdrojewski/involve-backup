/* Copyright (C) Brian Camacho and Zuzanna Opała - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Brian Camacho <brian.camacho@invity.space> and Zuzanna Opała <zuzanna.opala@invity.space>, July 2017
 */

var crypto = require('crypto');

function CreateLeader(user) {
    return {
        title: 'Lider',
        description: 'Rozdziela zadania w projekcie',
        recruitment: false,
        skill: "ISTZAR",
        members: [user._id.toString()]
    }
}

function CreateProjectMember(user, role) {
    return {
        id: user._id.toString(),
        online: false
    }
}

module.exports.CreateApplication = function (roles, user, explanation, isMember) {
    console.log('Roles Array: ');
    console.log(roles);
    var roleTitles = [];
    var isLeader = false;
    roles.forEach(function (role) {
        if(role == 'Lider') {
            isLeader = true;
            return;
        }
        roleTitles.push({role: role, accepted: isMember});

    });
    if(isLeader) {
        explanation = 'Użytkownik jest liderem zespołu';
    }

    return {
        id: user._id.toString(),
        description: user.personalData.description,
        explanation: explanation,
        roles: roleTitles
    }
};
/**
 * @param Type: [kicked|accepted|invited|rejected|applied|verified|test|message]
 * @param linkTo (string)  hash of the project to link to or id of a user to link to
 * @param data (additional data, ie project name)
 * @returns {object}
 *  
 *  Type == applied -> data required name and surname of applicant
 */
function CreateNotification( Type, linkTo, data) {
    
    var id = crypto.randomBytes(16).toString('hex');

    if (Type == 'not-geocoded') {
        return {
            title: 'Nie udalo nam sie ustalic polozenia twojego miasta',
            description: 'Nie bedziemy w stanie go uwzglednic przy wyszukiwaniu projektow.',

            icon: '/default.svg',
            Type: 'default',

            seen: false,
            hash: id,
            link: '/static/profile.html'
        }
    }

    if (Type == 'kicked') {
        return {
            title: 'Zostales wyproszony z zespolu',
            description: 'Lider wyprosil cie z zespolu pracujacego nad projektem ' + data.projectName + '.',

            icon: '/kicked.svg',
            Type: 'important',
            
            seen: false,
            hash: id,
            link: '/static/project.html?project=' + linkTo
        }
    }
    if (Type == 'accepted') {
        return {
            title: 'Twoje zgloszenie zostalo przyjete',
            description: 'Lider zespolu ' + data.projectName + ' rozpatrzyl twoje zgloszenie pozytywnie. Gratulujemy!',

            icon: '/accepted.svg',
            Type: 'important',
            
            seen: false,
            link: '/static/project.html?project=' + linkTo,
            hash: id
        }
    }
    if (Type == 'invited') {
        return {
            title: 'Zostales zaproszony do zespolu',
            description: 'Lider zaprosil cie do zespolu pracujacego nad projektem ' + data.projectName + '.',
            
            icon: '/invited.svg',
            Type: 'important',
            
            seen: false,
            link: '/static/project.html?project=' + linkTo,
            hash: id
        }
    }
    if (Type == 'rejected') {
        return {
            title: 'Twoje zgloszenie zostalo odrzucone',
            description: 'Lider zespolu ' + data.projectName + ' rozpatrzyl twoje zgloszenie negatywnie.',
            
            icon: '/rejected.svg',
            Type: 'default',
            
            seen: false,
            link: '/static/project.html?project=' + linkTo,
            hash: id
        }
    }

    if (Type == 'applied') {
        return {
            title: 'Ktoś zgłosił się do jednego z Twoich projektów! ',
            description: 'Twój projekt ' + data.projectName + ' otrzymał zgłoszenie od ' + data.name + ' ' + data.surname + '.',
            
            icon: '/applied.svg',
            Type: 'default',
            
            seen: false,
            link: '/static/project.html?project=' + linkTo,
            hash: id
        }
    }
    if (Type == 'verified') {
        return {
            title: 'Twój adres email został potwierdzony.',
            description: 'Jeżeli zapomnisz swojego hasła, będziesz mógł odzyskać dostęp do swojego konta z pomocą tego adresu.',

            icon: '/verified.svg',
            Type: 'default',

            seen: false,
            link: '/static/cockpit.html',
            hash: id
        }
    }

    if (Type == 'test') {
        return {
            title: 'Testowe powiadomienie',
            description: 'Opis powiadomienia',
            
            image: '/verified.svg',
            Type: 'default',
            
            seen: false,
            link: '/static/project.html?project=',
            hash: id
        }
    }

    if (Type == 'closure-requested') {
        return {
            title: 'Lider projektu prosi o zamknięcie',
            description: 'Lider jednego z projektów, którym mentorujesz poprosił o zamknięcie projektu oraz ustalenie, czy odniósł on sukces',

            image: '/default.svg', //TODO: Add notification icon for closure and closure requests
            Type: 'default',

            seen: false,
            link: '/static/project.html?project=' + linkTo,
            hash: id
        }
    }

    if (Type == 'project-closed') {
        return {
            title: 'Zamknięto projekt, w którym uczestniczysz',
            description: 'Na prosbę lidera projektu, mentor projektu ' + data.projectName + ' zamknął projekt. Projekt został uznany za ' + data.success +'.',

            image: '/default.svg', //TODO: Add notification icon for closure and closure requests
            Type: 'default',

            seen: false,
            link: '/static/project.html?project=' + linkTo,
            hash: id
        }
    }

    if(Type == 'message') {
        return {
            title: 'Nowe wiadomości',
            description: 'Na czacie projektu ' + data.projectName + ' są nowe wiadomośći.',

            image: '/default.svg',
            Type: 'default',

            seen: false,
            link: '/static/project.html?project=' + linkTo,
            hash: id,

            fromProject: data.projectId
        }
    }

    console.log('Notification creator error, ' + Type + ' is not a valid Type. Returning {}');
    return {};
}
var ProjectTypes = [
    'kicked',
    'joined',
    'invited',
    'rejected',
    'mentor-responded',
    'update-profile',
    'update-project'
];
module.exports.CreateLeader = CreateLeader;
module.exports.CreateNotification = CreateNotification;
module.exports.CreateProjectMember = CreateProjectMember;