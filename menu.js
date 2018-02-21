const express = require('express');
const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');
const { getMenuItemsForMenu, menuitemsRouter } = require('./menuitem');
const menuRouter = express.Router();
// function to check menu object has required fields set
const isValidMenu = (menu) => {
	if (menu.title) {
		return true;
	} else {
		return false;
	}
}
// db function to get all menus
const getAllMenus = (mycallback) => {
	db.all('SELECT * FROM Menu', (error,rows) => {
		if (!error) {
			mycallback(rows)
		} else {
			console.log(`error getting all menus: ${error}`);
		}
	});
}
// db function to get an menu by id
const getMenuByID = (myid,mycallback) => {
	db.get("SELECT * from Menu where id=$myId",
		{
			$myId: myid,
		},
		(error,row) => {
			if (!error){
				mycallback(row);
			} else {
				console.log(`error selecting menu by id: ${myid} ${error}`);
			}
		}
	);
}
// db function to delete menu by id
const deleteMenuById = (id,mycallback) => {
	db.run("DELETE from Menu where id=$id",
		{
			$id: id,
		},
		(error) => {
			if (!error) {
				mycallback();
			} else {
				console.log(`error deleting menu ${id}: ${error}`)
			}
		}
	);
}
// db function to update menu by id
const updateMenuById = (menu,id,mycallback) => {
	db.run("UPDATE Menu SET title = $title WHERE id = $id",
		{
			$title: menu.title,
			$id: id,
		},
		function(error){
			if (!error) {
				mycallback(id);
			} else {
				console.log(`error updating menu: ${error} ${id}`);
			}
		}
	);
}
// db function to insert a new menu
const createNewMenu = (menu,mycallback) => {
	db.run("INSERT into Menu (title) VALUES($title)",
		{
			$title: menu.title,
		},
		function(error) {
			if (!error) {
				mycallback(this.lastID);
			} else {
				console.log(`error inserting new menu: ${error}`);
			}
		}
	);
}
// our GET route for /menu
menuRouter.get('/',(req,res,next) => {
	let menus = getAllMenus( (data) => {
		res.status(200).send({menus:data});
	} );
});
// our POST route to add a new menu
menuRouter.post('/',(req,res,next) => {
	let validMenu = isValidMenu(req.body.menu);
	if (validMenu) {
		let newlyCreatedMenu = createNewMenu(req.body.menu, (id) => {
			getMenuByID(id, (menu) => {
				res.status(201).send({menu:menu});
			})
		});
	} else {
		res.status(400).send();
	}
});
// handle the menuId param for all routes using it
menuRouter.param('menuId', (req,res,next,myid) => {
	let menu = getMenuByID(myid, (_menu) => {
		if (_menu === undefined) {
			res.status(404).send();
		} else {
			req.menu = _menu;
			req.id = myid;
			next();
		}
	});
});
// our GET route for a single menu
menuRouter.get('/:menuId',(req,res,next) => {
	res.status(200).send({menu:req.menu});
});
// our PUT route for a single menu
menuRouter.put('/:menuId', (req,res,next) => {
	let validMenu = isValidMenu(req.body.menu);
	if (validMenu){
		let updatedMenu = updateMenuById(req.body.menu,req.id, (id) => {
			getMenuByID(req.id, (menu) => {
				res.status(200).send({menu:menu});
			})
		});
	} else {
		res.status(400).send();
	}
});
// our DELETE route to delete a single menu
menuRouter.delete('/:menuId',(req,res,next) => {
	let menuItems = getMenuItemsForMenu(req.id, (_menuItems) => {
		if (_menuItems.length > 0) {
			res.status(400).send();
		} else {
			let deletedMenu = deleteMenuById(req.id, (deletedError) => {
				if (!deletedError) {
					res.status(204).send();
				} else {
					res.status(400).send();
				}
			});
		}
	});
});
// mount up the menu items router
menuRouter.use('/:menuId/menu-items',menuitemsRouter);
module.exports = menuRouter;
