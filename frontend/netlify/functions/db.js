const mongoose = require('mongoose');

let connection;

const connectToDatabase = async () => {
  if (connection && connection.readyState === 1) {
    return connection;
  }

  connection = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  return connection;
};

module.exports = { connectToDatabase };