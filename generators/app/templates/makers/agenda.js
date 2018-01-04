/**
 * Created by vedi on 23/01/15.
 */

'use strict';

const Bb = require('bluebird');
const { config } = require('app/app');
const log = require('config/log')(module);
const Agenda = Bb.promisifyAll(require('agenda'));

module.exports = app => new Bb((resolve, reject) => {
  try {
    const agenda = Bb.promisifyAll(
      new Agenda({ db: { address: config.mongo }, processEvery: config.agenda.processEvery }));

    app.registerProvider('agenda', () => agenda);
    agenda.JOB_NAMES = {};

    // we swallow starting in test mode
    if (process.env.NODE_ENV === 'test') {
      agenda.start = () => {
        log.info('agenda.start simulation');
      };
    }

    app.jobs.forEach((job) => {
      Object.assign(agenda.JOB_NAMES, job(agenda));
    });

    const graceful = () => {
      agenda.stop(() => {
        process.exit(0);
      });
    };

    process.on('SIGTERM', graceful);
    process.on('SIGINT', graceful);

    agenda.on('ready', () => {
      resolve(agenda);
    });
  } catch (err) {
    reject(err);
  }
});
