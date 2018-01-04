/**
 * Created by vedi on 11/01/16.
 */

'use strict';

const http = require('http');
const Sio = require('socket.io');
const redis = require('socket.io-redis');

const { config } = require('app/app');
const log = require('config/log')(module);

module.exports = (app) => {
  const server = http.createServer(app);
  const sio = app.sio = Sio(server);

  sio.adapter(redis(config.redis.url));

  const authDelegate = app.oAuthifizer.authDelegate;

  sio.use((socket, next) => {
    let clientData;
    let token;
    const auth = socket.request.headers.authorization || socket.request._query.authorization;
    if (auth) {
      const parts = auth.split(' ');
      let value = parts[1];
      if (value) {
        if (parts[0].toLowerCase() === 'basic') {
          // credentials
          value = new Buffer(value, 'base64').toString();
          value = value.match(/^([^:]*):(.*)$/);
          if (value) {
            clientData = {
              clientId: value[1],
              clientSecret: value[2],
            };
          }
        } else if (parts[0].toLowerCase() === 'bearer') {
          token = value;
        }
      }
    }

    if (token) {
      return authDelegate
        .findUserByToken({ accessToken: token })
        .then((result) => {
          if (!result || !result.obj) {
            throw new Error('Wrong credentials');
          }

          socket.handshake.user = result.obj;
        })
        .asCallback(next);
    } else if (clientData) {
      return authDelegate
        .findClient(clientData)
        .then((result) => {
          if (!result) {
            throw new Error('Wrong client data');
          }

          socket.handshake.client = result;
        })
        .asCallback(next);
    } else {
      const err = new Error('No auth data available');
      log.error(err);
      return next(err);
    }
  });

  sio.use((socket, next) => {
    try {
      const { user } = socket.handshake;
      if (user) {
        socket.join(`user#${user._id}`);
      }
      return next();
    } catch (err) {
      return next(err);
    }
  });


  sio.on('connection', (socket) => {
    log.info('connected');

    socket.on('error', (err) => {
      log.error('Error happened');
      log.error(err);
    });
  });
  app.http = server;
};
