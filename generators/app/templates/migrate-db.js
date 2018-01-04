'use strict';

const migrate = require('migrate');

const app = require('app/app');
const log = require('config/log')(module);

module.exports = async () => {
  try {
    await app.init();
    const { modelProvider: { Migration } } = app;
    const key = 'main';

    log.info('Running migration...');

    const migration = migrate.load('migrations/.migrate', 'migrations');

    migration.save = function save(callback) {
      return Migration
        .findOneAndUpdate({
          key,
        }, {
          migrations: this.migrations,
          pos: this.pos,
        }, {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        })
        .then(() => {
          this.emit('save');
        })
        .asCallback(callback);
    };

    migration.load = function load(callback) {
      this.emit('load');

      Migration.findOne({ key }).lean().exec()
        .then((migrationData) => {
          if (!migrationData) {
            migrationData = {
              pos: 0,
            };
          }

          return migrationData;
        })
        .asCallback(callback);
    };

    const isUp = (process.argv[3] !== 'down');

    const callback = (err) => {
      if (err) {
        throw err;
      }
      log.info('Migration completed');
      process.exit(0);
    };

    if (isUp) {
      log.info('migrating up');
      migration.up(callback);
    } else {
      log.info('migrating down');
      migration.down(callback);
    }
  } catch (err) {
    log.error('The migration failed with error', err);
    process.exit(1);
  }
};
