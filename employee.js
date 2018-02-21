const express = require('express');
const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');
const employeeRouter = express.Router();
// function to check employee object has required fields set
const isValidEmployee = (employee) => {
	if (employee.name && employee.position && employee.wage) {
		return true;
	} else {
		return false;
	}
}
// db function to get all employees
const getAllEmployees = (mycallback) => {
	db.all('SELECT * FROM Employee where is_current_employee = 1', (error,rows) => {
		if (!error) {
			mycallback(rows)
		} else {
			console.log(`error getting all employees: ${error}`);
		}
	});
}
// db function to get an employee by id
const getEmployeeByID = (myid,mycallback) => {
	db.get("SELECT * from Employee where id=$myId",
		{
			$myId: myid,
		},
		(error,row) => {
			if (!error){
				mycallback(row);
			} else {
				console.log(`error selecting employee by id: ${myid} ${error}`);
			}
		}
	);
}
// db function to delete employee by id
const deleteEmployeeById = (id,mycallback) => {
	db.run("UPDATE Employee SET is_current_employee = 0 where id=$id",
		{
			$id: id,
		},
		(error) => {
			if (!error) {
				mycallback(true);
			} else {
				mycallback(false);
			}
		}
	);
}
// db function to update employee by id
const updateEmployeeById = (employee,id,mycallback) => {
	if (employee.isCurrentEmployee) {
		// this is for the restore button
		db.run("UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $is_current_employee WHERE id = $id",
			{
				$name: employee.name,
				$position: employee.position,
				$wage: employee.wage,
				$is_current_employee: employee.isCurrentEmployee,
				$id: id,
			},
			function(error){
				if (!error) {
					mycallback(id);
				} else {
					console.log(`error updating employee: ${error} ${id}`);
				}
			}
		);
	} else {
		// this is for the regular put method
		db.run("UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE id = $id",
			{
				$name: employee.name,
				$position: employee.position,
				$wage: employee.wage,
				$id: id,
			},
			function(error){
				if (!error) {
					mycallback(id);
				} else {
					console.log(`error updating employee: ${error} ${id}`);
				}
			}
		);
	}
}
// db function to insert a new employee
const createNewEmployee = (employee,mycallback) => {
	db.run("INSERT into Employee (name,position,wage) VALUES($name,$position,$wage)",
		{
			$name: employee.name,
			$position: employee.position,
			$wage: employee.wage,
		},
		function(error) {
			if (!error) {
				mycallback(this.lastID);
			} else {
				console.log(employee);
				console.log(`error inserting new employee : ${error}`);
			}
		}
	);
}
// our GET route for /employee
employeeRouter.get('/',(req,res,next) => {
	let employees = getAllEmployees( (data) => {
		res.status(200).send({employees:data});
	} );
});
// our POST route to add a new employee
employeeRouter.post('/',(req,res,next) => {
	let validEmployee = isValidEmployee(req.body.employee);
	if (validEmployee) {
		let newlyCreatedEmployee = createNewEmployee(req.body.employee, (id) => {
			getEmployeeByID(id, (employee) => {
				res.status(201).send({employee:employee});
			})
		});
	} else {
		res.status(400).send();
	}
});
// handle the employeeId param for all routes using it
employeeRouter.param('employeeId', (req,res,next,myid) => {
	let employee = getEmployeeByID(myid, (_employee) => {
		if (_employee) {
			req.employee = _employee;
			req.id = myid;
			next();
		} else {
			res.status(404).send();
		}
	});
});
// our GET route for a single employee
employeeRouter.get('/:employeeId',(req,res,next) => {
	if (req.employee) {
		res.status(200).send({employee:req.employee});
	} else {
		res.status(404).send();
	}
});
// our PUT route for a single employee
employeeRouter.put('/:employeeId', (req,res,next) => {
	let validEmployee = isValidEmployee(req.body.employee);
	if (validEmployee){
		let updatedEmployee = updateEmployeeById(req.body.employee,req.id, (id) => {
			getEmployeeByID(req.id, (employee) => {
				res.status(200).send({employee:employee});
			})
		});
	} else {
		res.status(400).send();
	}
});
// our DELETE route to delete a single employee
employeeRouter.delete('/:employeeId',(req,res,next) => {
	let deletedEmployee = deleteEmployeeById(req.id, (_deletedEmployee) => {
		if (_deletedEmployee) {
			getEmployeeByID(req.id, (employee) => {
				res.status(200).send({employee:employee});
			})
		} else {
			res.status(404).send();
		}
	});
});

const timesheetRouter = require('./timesheet');
employeeRouter.use('/:employeeId/timesheets',timesheetRouter);

module.exports = employeeRouter,getEmployeeByID;
