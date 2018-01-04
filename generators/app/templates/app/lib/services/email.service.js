/**
 * Created by vedi on 01/02/16.
 */

'use strict';

const Bb = require('bluebird');
const swig = require('swig');
const { config } = require('app/app');
const emailConfig = require('config/email');
const log = require('config/log')(module);

const emailValidationEmailOptions = {
  subject: `Welcome to ${config.app.title} - User account activation`,
};
const forgotEmailOptions = {
  subject: 'Reset password',
};
const resetEmailOptions = {
  subject: 'Your password has been changed',
};
const invitationEmailOptions = {
  subject: 'Invitation',
};
const notificationEmailOptions = {
  subject: 'Notification',
};
class EmailService {
  constructor() {
    if (config.isTest) {
      this.sentEmails = [];
    }
  }
  sendEmailVerificationEmail(event) {
    const { user } = event;
    const template = this._buildTemplatePath('email-verification', event.locale);
    const templateData = {
      email: user.username,
      appTitle: config.app.title,
      url: `${event.baseUrl}/?token=${user.emailVerification.token}`,
    };
    const emailData = Object.assign({
      to: user.username,
    }, emailValidationEmailOptions);
    return this._sendEmail(template, templateData, emailData);
  }
  sendForgotEmail(event) {
    const template = this._buildTemplatePath('forgot');
    const templateData = {
      appName: config.app.title,
      name: `${event.user.firstName} ${event.user.lastName}`,
      url: `${event.baseUrl}/restore-password?token=${event.user.resetPassword.token}`,
    };
    const emailData = Object.assign({
      to: event.user.username,
    }, forgotEmailOptions);
    return this._sendEmail(template, templateData, emailData);
  }
  sendResetEmail(event) {
    const template = this._buildTemplatePath('reset');
    const templateData = {
      appName: config.app.title,
      name: `${event.user.firstName} ${event.user.lastName}`,
    };
    const emailData = Object.assign({
      to: event.user.username,
    }, resetEmailOptions);
    return this._sendEmail(template, templateData, emailData);
  }
  sendInvitationEmail(event) {
    const template = this._buildTemplatePath('invitation');
    const templateData = {
      appName: config.app.title,
      name: event.user.name,
      url: `${event.baseUrl}/invitations/accept`,
    };
    const emailData = Object.assign({
      to: event.email,
    }, invitationEmailOptions);
    return this._sendEmail(template, templateData, emailData);
  }
  sendNotification(emails, message) {
    const templateData = {
      appName: config.app.title,
      message,
    };
    const notificationTpl = swig.compileFile('app/views/en/templates/notification.email.view.html');
    return Bb
      .try(() => notificationTpl(templateData))
      .then(emailHtml => Bb
        .map(emails, (email) => {
          const emailData = Object.assign({
            to: email,
          }, notificationEmailOptions);
          return this._sendEmail(emailHtml, false, emailData);
        }));
  }
  _buildTemplatePath(name, locale = config.i18n.defaultLocale) {
    return `app/views/${locale}/templates/${name}.email.view.html`;
  }
  _sendEmail(template, templateData, emailData) {
    return Bb
      .try(() => {
        if (typeof template === 'string' && templateData) {
          return swig.compileFile(template);
        } else {
          return template;
        }
      })
      .then((compiledTemplate) => {
        if (templateData) {
          return compiledTemplate(templateData);
        } else {
          return compiledTemplate;
        }
      })
      .then((emailHtml) => {
        const mailOptions = Object.assign({
          html: emailHtml,
        }, emailData, emailConfig.options);
        log.info(`Sending mail to: ${mailOptions.to}`);
        if (!config.isTest) {
          return emailConfig.transport.sendMailAsync(mailOptions);
        } else {
          log.debug('emailService._sendEmail stub called');
          this.sentEmails.push(mailOptions);
        }
      })
      .catch((err) => {
        log.error(`Cannot send mail: ${err}`);
      });
  }
}
module.exports = new EmailService();
