/**
 * Created by vedi on 12/09/16.
 */

'use strict';

const im = require('istanbul-middleware');
const { config } = require('app/app');

module.exports = (app) => {
  const coverageEnabled = config.coverageEnabled;
  // before your code is require()-ed, hook the loader for coverage
  if (coverageEnabled) {
    im.hookLoader(__dirname.replace('/app/lib/middleware', ''));
  }
  // add the coverage handler
  if (coverageEnabled) {
    // enable coverage endpoints under /coverage
    app.use('/coverage', im.createHandler());
  }
};
