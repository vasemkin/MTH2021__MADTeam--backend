// server.js
const express = require('express');
const path = require('path');
var appRoot = require('app-root-path');
const bodyParser = require('body-parser');
const app = express();
const readFile = require('./misc/readFile');
const mongoose = require('mongoose')
const port = 8000;

const config_path = path.join(appRoot.toString(), 'config', 'config.json');

readFile(config_path).then(config => {

  mongoose.Promise = global.Promise

  mongoose.connect(config.dbURI, 
                   { useNewUrlParser: true})
    .then(() => console.log('Connected to database.'))
    .catch((e) => {
      console.error(e);
      console.log('Cannot connect to database. Exiting.')
      process.exit()
    }
  )
  

  app.use(bodyParser.urlencoded({ extended: false }));
  // parse application/json
  app.use(bodyParser.json())

  require('./app/routes')(app, mongoose);
  
  app.listen(port, () => {
    console.log('We are live on ' + port);
  });


});

