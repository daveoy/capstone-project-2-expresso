const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const dbinit = require('./migration');
const PORT = process.env.PORT || 4000

app.use(bodyParser.json());
//app.use(morgan());
// turns out the frontend needs cors on
app.use(cors());

//add in the router from ./api.js
const apiRouter = require('./api');
app.use('/api', apiRouter);

app.listen(PORT);
module.exports = app;
