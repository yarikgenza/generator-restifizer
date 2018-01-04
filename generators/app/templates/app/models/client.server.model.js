'use strict';

const modelName = 'Client';

module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    name: {
      type: String,
      unique: true,
      required: true,
    },
    clientId: {
      type: String,
      unique: true,
      required: true,
    },
    clientSecret: {
      type: String,
      required: true,
    },
  });
  return mongoose.model(modelName, schema);
};
