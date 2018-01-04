/**
 * Created by vedi on 10/10/15.
 */

'use strict';

const morgan = require('morgan');
const { config } = require('app/app');

module.exports = (app, log) => {
  if (config.logger.suppressStdout) {
    return;
  }
  const detailedLogging = log.transports.console && log.levels &&
    log.levels[log.transports.console.level] <= log.levels.debug;
  // Enable logger (morgan)
  morgan.token('resdata', (req, res) => {
    const status = res.statusCode;
    let color = 32; // green
    if (status >= 500) {
      color = 31; // red
    } else if (status >= 400) {
      color = 33; // yellow
    } else if (status >= 300) {
      color = 36; // cyan
    }
    if (detailedLogging && res.statusCode !== 404) {
      return `\x1b[${color}m\n\treq->\x1b[90m${req.body ? (`\n${JSON.stringify(req.body, null, 2)}`) : ''
        }\x1b[${color}m\n\tres<-\x1b[90m${
        (res.restfulResult && !res.restfulResult.stream) ? (`\n${JSON.stringify(res.restfulResult, null, 2)}`) : ''}\x1b[0m`;
    } else {
      return '';
    }
  });
  app.use(morgan(':method :url :status :response-time ms - :res[content-length] :resdata'));
};
