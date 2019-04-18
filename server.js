const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { initRoutes } = require('./routes');
const { mongoUri } = require('./config');

const router = express.Router();

const app = express();
const port = process.env.PORT || 4000;

mongoose.connect(mongoUri, { useNewUrlParser: true });

const allowCrossDomain = function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  next();
};

app.use(allowCrossDomain);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

initRoutes(app, router);

app.listen(port);

console.log(`Server is running on port ${port}`);