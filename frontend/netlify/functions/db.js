const mongoose = require('mongoose');

let connection = null;

const getConnection = async () => {
  if (connection && connection.readyState === 1) {
    return connection;
  }

  if (!connection) {
    connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  return connection;
};

const closeConnection = async () => {
  if (connection) {
    await connection.disconnect();
    connection = null;
  }
};

module.exports = { getConnection, closeConnection };