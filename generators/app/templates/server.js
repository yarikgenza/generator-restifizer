'use strict';

const app = require('app/app');
const log = require('config/log')(module);
const bootstrap = require('config/bootstrap');

module.exports = async () => {
  try {
    await app.init();
    const { config: { app: { title }, port }, expressApp } = app;
    expressApp.http.listen(port);
    log.info(`"${title}" application started on port ${port}`);
    log.info('Running bootstrap script...');
    await bootstrap(app);
    log.info('Bootstrap script completed');
  } catch (err) {
    log.error(`Starting failed with error: ${err.message}`);
    process.exit(1);
  }
};
