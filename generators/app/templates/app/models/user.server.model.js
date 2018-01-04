'use strict';

const authPlugin = require('app/lib/restifizer.plugin/auth.restifizer.plugin');
const verificationPlugin = require('app/lib/restifizer.plugin/verification.restifizer.plugin');

const modelName = 'User';

module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    admin: {
      type: Boolean,
    },
  }, {
    timestamps: true,
  });


  schema.methods.isAdmin = function isAdmin() {
    return this.admin;
  };

  /**
   *  {
   *    username: {
   *      type: String,
   *      unique: 'User with this username already exists',
   *      sparse: true,
   *      required: [
   *        requiredForLocalProvider,
   *        'Path `{PATH}` is required.'
   *      ],
   *      trim: true,
   *      lowercase: true
   *    },
   *    hashedPassword: {
   *      type: String,
   *      default: '',
   *    },
   *    salt: {
   *      type: String
   *    },
   *    provider: {
   *      type: String,
   *      'default': LOCAL_PROVIDER,
   *      required: true
   *    },
   *    linkedAccounts: {}
   *  },
   *  resetPassword: {
   *    token: String,
   *    expires: Date
   *  },
   *
   *  schema.statics.logout(userId)
   *  schema.methods.hashPassword(password)
   *  schema.methods.authenticate(password)
   *  schema.virtual('password')
   */
  schema.plugin(authPlugin.mongoose, { mongoose });

  /**
   *
   * emailVerified: {
   *   type: Boolean,
   *   default: false,
   * },
   * emailVerification: {
   *   token: String,
   *   expires: Date,
   * },
   * */
  schema.plugin(verificationPlugin.mongoose);

  return mongoose.model(modelName, schema);
};
