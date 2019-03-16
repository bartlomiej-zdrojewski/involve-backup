/* Copyright (C) Brian Camacho and Zuzanna Opała - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Brian Camacho <brian.camacho@invity.space> and Zuzanna Opała <zuzanna.opala@invity.space>, July 2017
 */

// var nodemailer = require('nodemailer');
// var fs = require('fs');
// if (
//     process.env.SENDGRID_PASS == undefined ||
//     process.env.SENDGRID_USER == undefined ||
//     process.env.SENDGRID_SECRET == undefined
// )   console.log('Mail service uninitialised, restart required');
//
// var mailer = {};
// var transporter = nodemailer.createTransport({
//     service: 'SendGrid',
//     auth: {
//         user: process.env.SENDGRID_USER,
//         pass: process.env.SENDGRID_PASS
//     }
// });
require('dotenv').load();
const config = process.env;
const api_key = config.MAILGUN_KEY;
const domain = config.LOCAL_URL_SHORT;
const mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
const sourceAddress = 'noreply@invity.space';

function SendEmail(options, done) {
	mailgun.messages().send(options, function (error, body) {
		done(error === undefined ? null : error)
	});
}

/**
 *
 * @param recoveryHash {string}
 * @param address {string}
 * @param done {function}
 */
module.exports.SendRecoveryEmail = function (recoveryHash, address, done) {
    SendEmail({
	    to: address,
	    from: sourceAddress,
	    subject: 'Odzyskiwanie hasła',
	    text: 'Otrzymujesz tę wiadomość ponieważ otrzymaliśmy prośbę o wygenerowanie nowego hasła dla konta powiązanego z tym adresem email.'
	    + '\r\nPrzejdź na poniższy adres, żeby zmienić utracone hasło.\r\n\r\n'
	    + process.env.LOCAL_URL + '/recover.html?token=' + recoveryHash + '\r\n'
	    + '\r\nJeżeli nie prosiłeś o zmianę hasła, zignoruj tę wiadomość, lub skontaktuj się z nami pod adresem contact@invity.space.'
	    + '\r\nPozdrawiamy\r\n' +
	    '\r\nZespół Invity'
    }, done);
};
/**
 *
 * @param confirmationToken {string}
 * @param address {string}
 * @param done {function}
 */
module.exports.SendConfirmationEmail = function (confirmationToken, address, done) {
	SendEmail({
		to: address,
		from: sourceAddress,
		subject: 'Potwierdzenie adresu email',
		text: 'Dziękujemy za zarejestrowanie się jako użytkownik Invity!\r\n'
		+ '\r\nOstatni krok, jaki Ci pozostał, to potwierdzić swój adres email. '
		+ '\r\nŻeby to zrobić wystarczy kliknąć w link poniżej lub skopiować go do pola adresu przeglądarki\r\n\r\n'
		+ process.env.LOCAL_URL + '/confirm?token=' + confirmationToken + '\r\n\r\n'
		+ '\r\nPozdrawiamy\r\n' +
		'\r\nZespół Invity'
	}, done)
};
/**
 *
 * @param projectId {string}
 * @param address {string}
 * @param user {object}
 * @param done {function}
 */
module.exports.SendProjectInvitation = function (projectId, address, user, done) {
    SendEmail({
        to: address,
        from: sourceAddress,
        subject: 'Zaproszenie do współpracy',
        text: user.name + ' ' + user.surname + ' zaprosił(a) Cię do współpracy nad projektem realizowanym poprzez platformę Invity.\r\n'
        + '\r\nJeżeli jesteś zainteresowany/a współpracą, utwórz konto na invity.space'
        + '\r\n\r\nPozdrawiamy'
        + '\r\nZespół Invity'
    }, done);
};

/**
 * @param project {Object}
 * @param address {string}
 * @param URI {string}
 * @param reportData {Buffer}
 * @param done {function}
 */
module.exports.SendReportToMentor = function (project, address, URI, reportData, done) {
    if(reportData) SendEmail({
        to: address,
        from: sourceAddress,
        subject: 'Nowy raport',
        text: 'Zgloszono nowy raport dla ' + project.title + '!',
        attachment: new mailgun.Attachment({data: reportData, filename: project.title.toLowerCase() + '-report.txt'})
    }, done);
    else throw new Error('Attemted to send a mentor report without and attachement');
};
