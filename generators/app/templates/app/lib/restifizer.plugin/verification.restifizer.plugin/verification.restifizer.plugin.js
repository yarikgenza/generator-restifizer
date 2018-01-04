/**
 * Created by vedi on 02/07/16.
 */

'use strict';

const createAppError = require('app/lib/create-app-error');
const validateSchema = require('app/lib/validate-schema');
const app = require('app/app');

const {
  RULES: {
    WRONG_TOKEN_RULE,
  },
} = require('./verification.consts');

const {
  schemas: {
    VERIFY_EMAIL_SCHEMA,
    REGISTER_OR_VERIFY_SCHEMA,
  },
} = app;


function mongooseFn(schema) {
  schema.add({
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerification: {
      token: String,
      expires: Date,
    },
  });
}

/**
 * @apiIgnore
 * @apiGroup User
 * @apiName VerifyUserEmail
 * @api {post} /api/users/verify-email/:token Verify User Email
 * @apiDescription Verifies user email.
 * @apiPermission client
 *
 * @apiParam {String} token verification token, received in email
 * @apiParam {String} password new password
 *
 * @apiUse ClientAuthParams
 * @apiUse AuthSuccess
 */

/**
 * @apiIgnore
 * @apiGroup User
 * @apiName RegisterOrVerify
 * @api {put} /api/users/register-or-verify/:username Register or verify user
 * @apiDescription Initiates email verification (optionally creates user if needed).
 * @apiPermission client
 *
 * @apiParam {String} username username
 *
 * @apiUse ClientAuthParams
 * @apiUse UserResponse
 */

/**
 * @apiIgnore
 * @apiGroup User
 * @apiName CheckVerificationToken
 * @api {get} /api/users/check-verification-token/:token Check verification token
 * @apiDescription Checks verification token
 * @apiPermission client
 *
 * @apiParam {String} token token
 *
 * @apiUse ClientAuthParams
 * @apiUse UserResponse
 */

function restifizer(restifizerController, options) {
  const { Model, authenticate } = options;

  restifizerController.actions.verifyEmail = restifizerController.normalizeAction({
    auth: ['oauth2-client-password'],
    method: 'post',
    path: 'verify-email/:token',
    handler: async function verifyEmail(scope) {
      const { params: { token }, body } = scope;
      const { password } = await validateSchema(body, VERIFY_EMAIL_SCHEMA);

      const user = await Model
        .findOne({
          'emailVerification.token': token,
          'emailVerification.expires': {
            $gt: new Date(),
          },
        });
      if (!user) {
        throw createAppError(WRONG_TOKEN_RULE);
      }

      user.password = password;
      user.emailVerified = true;
      user.emailVerification = undefined;
      await user.save();
      return authenticate(user, scope);
    },
  }, 'verifyEmail');

  restifizerController.actions.registerOrVerify = restifizerController.normalizeAction({
    auth: ['oauth2-client-password'],
    method: 'put',
    path: 'register-or-verify/:username',
    handler: async function registerOrVerify(scope) {
      await validateSchema(scope.params, REGISTER_OR_VERIFY_SCHEMA);

      // we store username in lower case
      scope.params.username = scope.params.username.toLowerCase();
      scope.params.$or = [{ emailVerified: false }, { emailVerified: { $exists: false } }];
      return this.replace(scope);
    },
    afterChange() {
    },
  }, 'registerOrVerify');

  restifizerController.actions.checkVerificationToken = restifizerController.normalizeAction({
    auth: ['oauth2-client-password', 'basic'],
    method: 'get',
    path: 'check-verification-token/:token',
    handler: async function checkVerificationToken(scope) {
      const user = await Model.findOne({
        'emailVerification.token': scope.params.token,
        'emailVerification.expires': { $gt: new Date() },
      });

      if (!user) {
        throw createAppError(WRONG_TOKEN_RULE);
      }
    },
  }, 'checkVerificationToken');
}

module.exports.restifizer = restifizer;
module.exports.mongoose = mongooseFn;
