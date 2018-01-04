/**
 * Created by vedi on 10/10/15.
 */

'use strict';

const _ = require('lodash');
const Restifizer = require('restifizer');
const app = require('app/app');

const { consts: { AUTH } } = app;

const ExpressTransport = Restifizer.ExpressTransport;
const SocketIoTransport = Restifizer.SocketIoTransport;

module.exports = (expressApp, log, Controllers) => {
  const expressTransport = new ExpressTransport({ app: expressApp });
  const { eventBus } = app;
  const eventTypes = _.values(eventBus.ENTITY_EVENT_TYPES);

  function prepareAuth(options) {
    if (options.auth) {
      // make options.auth to be an array
      if (!Array.isArray(options.auth)) {
        options.auth = [options.auth];
      } else {
        options.auth = _.uniq(options.auth);
      }

      // always add basic auth to client auth
      if (options.auth.includes(AUTH.CLIENT) && !options.auth.includes(AUTH.BASIC)) {
        options.auth.push(AUTH.BASIC);
      }
    }
  }

  expressTransport.getAuth = function getAuth(options) {
    prepareAuth(options);
    const auths = [
      expressApp.oAuthifizer.authenticate(options.auth),
      (req, res, next) => {
        if (!req.isAuthenticated()) {
          // options
          return res.status(401).send({
            message: 'User is not logged in',
          });
        }

        next();
      },
    ];
    return options.auth ? auths : (req, res, callback) => {
      callback();
    };
  };

  const socketIoTransport = new SocketIoTransport({
    sio: expressApp.sio,
  });

  const restifizer = new Restifizer({
    transports: [expressTransport, socketIoTransport],
    log,
  });

  Controllers.forEach((Controller) => {
    restifizer.addController(Controller);

    const extractedName = Controller.getName();

    eventTypes.forEach((type) => {
      eventBus.ENTITY_EVENTS[`${extractedName}.${type}`] = `${extractedName}.${type}`;
    });
  });

  eventBus.register(eventBus.ENTITY_EVENT_SPACE, eventBus.ENTITY_EVENTS);
};
