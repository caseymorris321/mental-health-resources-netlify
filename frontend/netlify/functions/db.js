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



module.exports = { getConnection };