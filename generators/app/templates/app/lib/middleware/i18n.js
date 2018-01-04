/**
 * Created by vedi on 05/27/16.
 */

'use strict';

const i18n = require('i18n');

const { config } = require('app/app');

module.exports = (app) => {
  i18n.configure({
    defaultLocale: config.i18n.defaultLocale,
    directory: `${__dirname}/../../../config/locales`,
    indent: '  ',
    extension: '.json',
    objectNotation: true,
  });

  app.use(i18n.init);
};
