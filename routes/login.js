let express = require('express');

let bcrypt = require('bcryptjs');
let jwt = require('jsonwebtoken');

let dbSetup = require('../db');
const assert = require('assert');

let router = express.Router();

const secretKey = 'C-UFRaksvPKhx1txJYFcut3QGxsafPmwCY6SCly3G6c';


//for the GET
router.get('/', function(req, res, next) {
	let redir = req.query.redirect;
	res.render('login', { redirect: redir });
});

//for the POST
router.post('/', function (req, res, next) {
	let username = req.body.username;
	let inputPassword = req.body.password;
	let redir = req.body.redirect;
	
	let db = dbSetup.get();
	if (db == null) {
		console.log("database is null");
	}
	db.collection('Users').findOne({ 'username': username })
		.then(function (result) {
			//if we don't find the user we can return back to the login page with the same redirect
			//except we do return the 401 status for unauthorized
			if (result == null) {
				res.status(401);
				res.render('login', { redirect: redir });
			} else {
				//the user is there and now we check the rest
				bcrypt.compare(inputPassword, result.password, function(err, compRes) {
					if (compRes) {
						//if password did match
						//gotta get the cookie seesions
						let now = new Date();
						const expiration = Math.round(now.getTime() / 1000) + 7200;
						//console.log("Now: " + now.getTime() + "exper: " + expiration);
						
						// Generate an access token
						//luckily for us jwt is in HS256 by default
						jwt.sign({ exp: expiration,  usr: username }, secretKey, (err, token) => {
							if (err) {
								res.status(500).send("Could not sign jwt");
							}
							//console.log(token);
							res.cookie('jwt', token);
							
							if (redir != null) {
								//if there's a redirect redirect to it
								res.redirect(redir);
							} else {
								//if not then we just return code 200 and the body saying the authentication was successful
								res.status(200).send("Authentication was successful!");
							}
						});
					} else {
						//if password failed
						//console.log("Wrong password");
						res.status(401);
						res.render('login', { redirect: redir });
					}
				});
			}
		});
});

module.exports = router;
