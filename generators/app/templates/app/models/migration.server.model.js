'use strict';

const modelName = 'Migration';

module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    key: {
      type: String,
      required: true,
      unique: true,
    },
    migrations: [{
      title: {
        type: String,
        required: true,
      },
    }],
    pos: {
      type: Number,
      required: true,
    },
  }, {
    timestamps: true,
  });

  return mongoose.model(modelName, schema);
};
