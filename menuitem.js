const express = require('express');
const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');
const menuitemsRouter = express.Router();

// function to check menu item object has required fields set
const isValidMenuItem = (menuItem) => {
	if (menuItem.name && menuItem.inventory && menuItem.price) {
		return true;
	} else {
		return false;
	}
}
// db function to get an menu by id
const getMenuItemByID = (myid,mycallback) => {
	db.get("SELECT * from MenuItem where id=$myId",
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
// db function to delete menu item by id
const deleteMenuItemById = (id,mycallback) => {
	db.run("DELETE from MenuItem where id=$id",
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
// db function to get all menu-items for menu id
const getMenuItemsForMenu = (id,mycallback) => {
	db.all('SELECT * FROM MenuItem WHERE menu_id = $id',
		{
			$id: id,
		},
		(error,rows) => {
			if (!error) {
				mycallback(rows);
			} else {
				console.log(`error getting menu items for ${id}: ${error}`);
			}
		}
	);
}
// db function to update menu by id
const updateMenuItemById = (menuItem,menuItemId,menuId,mycallback) => {
	db.run("UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menu_id WHERE id = $id",
		{
			$name: menuItem.name,
			$description: menuItem.description,
			$inventory: menuItem.inventory,
			$price: menuItem.price,
			$menu_id: menuId,
			$id: menuItemId,
		},
		function(error){
			if (!error) {
				mycallback(this.lastID);
			} else {
				console.log(`error updating menu: ${error} ${id}`);
			}
		}
	);
}
// db function to insert a new menu item
const createNewMenuItem = (menuitem,mycallback) => {
	db.run("INSERT into MenuItem (name,description,inventory,price,menu_id) VALUES($name,$description,$inventory,$price,$menu_id)",
		{
			$name: menuitem.name,
			$description: menuitem.description,
			$inventory: menuitem.inventory,
			$price: menuitem.price,
			$menu_id: menuitem.menu_id,
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

// our GET route for a single menu's menuitems by id
menuitemsRouter.get('/',(req,res,next) => {
	let menuItems = getMenuItemsForMenu(req.id, (_menuItems) => {
		res.status(200).send({'menuItems':_menuItems});
	});
});
// our POST route for adding a new menuitem
menuitemsRouter.post('/',(req,res,next) => {
	req.body.menuItem.menu_id = req.id;
	let validMenuItem = isValidMenuItem(req.body.menuItem);
	if (validMenuItem) {
		let newlyCreatedMenu = createNewMenuItem(req.body.menuItem, (id) => {
			getMenuItemByID(id, (menuItem) => {
				res.status(201).send({menuItem:menuItem});
			});
		});
	} else {
		res.status(400).send();
	}
});
// handle the menuItemId param for all routes using it
menuitemsRouter.param('menuItemId', (req,res,next,myid) => {
	let menu = getMenuItemByID(myid, (_menuitem) => {
		if (_menuitem === undefined) {
			res.status(404).send();
		} else {
			req.menuitem = _menuitem;
			req.menuitemid = myid;
			next();
		}
	});
});
// our PUT route for a single menuitem
menuitemsRouter.put('/:menuItemId', (req,res,next) => {
	req.body.menuItem.menu_id = req.id;
	let validMenuItem = isValidMenuItem(req.body.menuItem);
	if (validMenuItem){
		let updatedMenuItem = updateMenuItemById(req.body.menuItem,req.menuitemid,req.id, (id) => {
			getMenuItemByID(req.menuitemid, (menuItem) => {
				res.status(200).send({menuItem:menuItem});
			})
		});
	} else {
		res.status(400).send();
	}
});
// our DELETE route for a single menuitem
menuitemsRouter.delete('/:menuItemId', (req,res,next) => {
	let deletedMenuItem = deleteMenuItemById(req.menuitemid, (deletedError) => {
		if (!deletedError) {
			res.status(204).send();
		} else {
			res.status(400).send();
		}
	});
});

module.exports = { getMenuItemsForMenu, menuitemsRouter };
