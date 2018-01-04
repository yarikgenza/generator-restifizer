/**
 * Created by vedi on 08/07/16.
 */

'use strict';

const log = require('config/log')(module);
const app = require('app/app');
const Mocha = require('mocha');

module.exports = () => {
  app
    .init()
    .then(() => {
      // Instantiate a Mocha instance.
      const mocha = new Mocha({
        ui: 'bdd',
        fullTrace: true,
        timeout: 1000,
      });
      app.tests.forEach((filePath) => {
        mocha.addFile(filePath);
      });
      // Run the tests.
      mocha.run((failures) => {
        process.exit(failures);  // exit with non-zero status if there were failures
      });
    })
    .catch((err) => {
      log.error('The tests failed with error', err);
      process.exit(1);
    });
};
