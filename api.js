const express = require('express');
const apiRouter = express.Router();
// add in the employee router at /employees
const employeeRouter = require('./employee');
// add in the menu router at /menu
const menuRouter = require('./menu');

apiRouter.use('/employees', employeeRouter);
apiRouter.use('/menus', menuRouter);

module.exports = apiRouter;
