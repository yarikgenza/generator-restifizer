'use strict';

const modelName = 'RefreshToken';

module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    userId: {
      type: String,
      required: true,
    },
    clientId: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      unique: true,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

  return mongoose.model(modelName, schema);
};

