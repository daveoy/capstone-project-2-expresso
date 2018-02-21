const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');

// create the employees table
db.run("CREATE TABLE IF NOT EXISTS Employee (id INTEGER PRIMARY KEY, name TEXT NOT NULL, position TEXT NOT NULL, wage INTEGER NOT NULL, is_current_employee INTEGER NOT NULL DEFAULT 1)",
	error => {
		if (error) {
			console.log(error);
		}
	}
);
// create the ttimesheets table
db.run("CREATE TABLE IF NOT EXISTS Timesheet (id INTEGER PRIMARY KEY, hours INTEGER NOT NULL, rate INTEGER NOT NULL, date INTEGER NOT NULL, employee_id INTEGER NOT NULL)",
	error => {
		if (error) {
			console.log(error);
		}
	}
);
// create the menus table
db.run("CREATE TABLE IF NOT EXISTS Menu (id INTEGER PRIMARY KEY, title TEXT NOT NULL)",
	error => {
		if (error) {
			console.log(error);
		}
	}
);
// create the menuitems table
db.run("CREATE TABLE IF NOT EXISTS MenuItem (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT, inventory INTEGER NOT NULL, price INTEGER NOT NULL, menu_id INTEGER NOT NULL)",
	error => {
		if (error) {
			console.log(error);
		}
	}
);

module.exports = db;
