const express = require('express');
const sqlite = require('sqlite3');
const { employeeRouter,getEmployeeByID } = require('./employee');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');
const timesheetRouter = express.Router();

const isValidTimesheet = (timesheet) => {
	if (timesheet.rate && timesheet.hours && timesheet.date) {
		return true;
	} else {
		return false;
	}
}
const getTimesheetsForEmployee = (employee_id,mycallback) => {
	db.all("SELECT * FROM Timesheet where employee_id = $employee_id",
		{
			$employee_id: employee_id,
		},
		(error,rows) => {
			if (!error) {
				mycallback(rows);
			} else {
				console.log(`error fetching timesheets for ${employee_id}: ${error}`);
			}
		}
	);
}
// db function to insert a new timesheet
const createNewTimesheet = (timesheet,employee_id,mycallback) => {
	db.run("INSERT into Timesheet (hours,rate,date,employee_id) VALUES($hours,$rate,$date,$employee_id)",
		{
			$hours: timesheet.hours,
			$rate: timesheet.rate,
			$date: timesheet.date,
			$employee_id: employee_id,
		},
		function(error) {
			if (!error) {
				mycallback(this.lastID);
			} else {
				console.log(`error inserting new timesheet: ${error}`);
			}
		}
	);
}
const getTimesheetByID = (myid,mycallback) => {
	db.get("SELECT * from Timesheet where id=$myId",
		{
			$myId: myid,
		},
		(error,row) => {
			if (!error){
				mycallback(row);
			} else {
				console.log(`error selecting Timesheet by id: ${myid} ${error}`);
			}
		}
	);
}
// db updater for timesheet by id
const updateTimesheetById = (timesheet,id,employee_id,mycallback) => {
	db.run("UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employee_id WHERE id = $id",
		{
			$hours: timesheet.hours,
			$rate: timesheet.rate,
			$date: timesheet.date,
			$employee_id: employee_id,
			$id: id,
		},
		function(error){
			if (!error) {
				mycallback(id);
			} else {
				console.log(`error updating timesheet: ${error} ${id}`);
			}
		}
	);
}
// db function to delete a timesheet by id
const deleteTimesheetById = (id,mycallback) => {
	db.run("DELETE from Timesheet where id = $id",
		{
			$id: id,
		},
		function(error){
			if (!error) {
				mycallback();
			} else {
				console.log(`error deleting timesheet ${id}: ${error}`)
			}
		}
	);
}
// handle the timesheetId param for all routes using it
timesheetRouter.param('timesheetId', (req,res,next,myid) => {
	let timesheet = getTimesheetByID(myid, (_timesheet) => {
		if (_timesheet) {
			req.timesheet = _timesheet;
			req.timesheetid = myid;
			next();
		} else {
			res.status(404).send();
		}
	});
});

// our GET router to get all timesheets
timesheetRouter.get('/', (req,res,next) => {
	if (!req.employee) {
		res.status(404).send()
	} else {
		let timesheets = getTimesheetsForEmployee(req.id, (data) => {
				res.status(200).send({timesheets:data});
		});
	}
});
// POST route to create a new timesheet
timesheetRouter.post('/',(req,res,next) => {
	if (!req.employee) {
		res.status(404).send()
	} else {
		let validTimesheet = isValidTimesheet(req.body.timesheet);
		if (validTimesheet) {
			let newlyCreatedTimesheet = createNewTimesheet(req.body.timesheet, req.id, (id) => {
				getTimesheetByID(id, (timesheet) => {
					res.status(201).send({timesheet:timesheet});
				});
			});
		} else {
			res.status(400).send();
		}
	}
});
// our PUT route for a single timesheet
timesheetRouter.put('/:timesheetId', (req,res,next) => {
	let validTimesheet = isValidTimesheet(req.body.timesheet);
	if (validTimesheet){
		let updatedTimesheet = updateTimesheetById(req.body.timesheet,req.timesheetid,req.id, (id) => {
			getTimesheetByID(req.timesheetid, (timesheet) => {
				res.status(200).send({timesheet:timesheet});
			});
		});
	} else {
		res.status(400).send();
	}
});
// our DELETE route for a single timesheet
timesheetRouter.delete('/:timesheetId', (req,res,next) => {
	let deletedTimesheet = deleteTimesheetById(req.timesheetid, (deleteError) => {
		if (!deleteError){
			res.status(204).send();
		} else {
			res.status(400).send();
		}
	});
});

module.exports = timesheetRouter;
