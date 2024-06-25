require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const resourceRoutes = require('./routes/resources');
const cors = require('cors');


// express app
const app = express();

// middleware
app.use(express.json())
app.use(cors());
app.use((req, res, next) => {
  console.log(req.path, req.method)
  next();
})

// routes
app.use('/api/resources', resourceRoutes);


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    // listen for requests
    app.listen(process.env.PORT, () => {
      console.log('connected to db & listening on port', process.env.PORT)
    })
  })
  .catch((error) => {
    console.log('MongoDB connection error:', error.message);
  });