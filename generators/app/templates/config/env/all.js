'use strict';

const appTitle = '<%= name %>';

module.exports = {
  port: process.env.PORT || 1340,
  mongo: process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost/<%= name %>',

  isTest: process.env.NODE_ENV === 'test',

  app: {
    title: appTitle,
  },

  security: {
    tokenLife: 3600,
    emailVerificationTokenLife: 3 * 24 * 3600,
  },

  i18n: {
    defaultLocale: 'ru',
  },

  redis: {
    keyPrefix: `${appTitle}.notifications`,
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  },

  aws: {
    accessKeyId: 'xxx',
    secretAccessKey: 'xxx',
  },

  email: {
    from: process.env.MAILER_FROM || 'no-reply@your-domain.com',
    options: {
      service: process.env.MAILER_SERVICE_PROVIDER || 'ses',
    },
  },

  google: {
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID || '95797648466-4pl3hu1t8igvbc151s70ogea9jq6onb0.apps.googleusercontent.com',
  },

  newRelic: {
    enabled: process.env.NEW_RELIC_ENABLED || false,
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY || '',
    appName: process.env.NEW_RELIC_APP_NAME || appTitle,
    logLevel: process.env.NEW_RELIC_LOG_LEVEL || 'info',
  },

  urls: {
    resetPassword: process.env.URL_RESET_PASSWORD || 'https://your-domain.com/#/reset_password/',
    verifyEmail: process.env.URL_VERIFY_EMAIL || 'verify-email',
  },

  agenda: {
    processEvery: '1 minute',
    checkRechargingEvery: '1 minute',
    reduceRatingEvery: '1 month',
    checkReducedRatingEvery: '1 minute',
  },

  logger: {
    suppressStdout: process.env.LOGGER_SUPPRESS_STDOUT,
    level: process.env.LOGGER_LEVEL || 'debug',
  },

  defaultClient: {
    name: process.env.CLIENT_NAME || 'default',
    clientId: process.env.CLIENT_ID || 'default',
    clientSecret: process.env.CLIENT_SECRET || 'default',
  },
  defaultUser: {
    username: process.env.DEFAULT_ADMIN_USERNAME || 'admin@vedidev.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'adminadmin',
    admin: true,
  },
};
