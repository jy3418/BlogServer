let express = require('express');
let router = express.Router();
let jwt = require('jsonwebtoken');
const client = require('../db');

const secretKey = 'C-UFRaksvPKhx1txJYFcut3QGxsafPmwCY6SCly3G6c';

// Function to authenticate the user upon an API request
const authenticate = (req, res, next) => {
    const token = req.cookies.jwt || '';
    if (token) {
	jwt.verify(token, secretKey, (err, decoded) => {
	    if (err) {
		return res.status(401).send("Error 401: Could not verify cookie.");
	    }
	    if (decoded.usr !== req.params.username) {
		return res.status(401).send("Error 401: Username does not match cookie's.");
	    }
	    req.user = decoded.usr;
	    next();
	});
    } else {
	res.status(401).send("Error 401: Must provide cookie to access api.");
    }
};

/* Temporary login request
router.post('/login', (req, res, next) => {
    // Read username and password from request body
    const { username, password } = req.body;

    // Get current time + 2 hours
    let now = new Date();
    const expiration = Math.round(now.getTime() / 1000) + 7200;
    
    // Generate an access token
    jwt.sign({ exp: expiration,  usr: username }, secretKey, (err, token) => {
	if (err) {
	    res.status(500).send("Could not sign jwt");
	}
	res.cookie('jwt', token);
	res.send('');
    });
});
*/

/* GET api from username */
router.get('/:username', authenticate, (req, res, next) => {
    let collection = client.get().collection('Posts');
    collection.find({username: req.user}).toArray((err, docs) => {
	if (err) {
	    return res.status(500).send('Error 500: could not retrieve from database.');
	}
	res.json(docs);
    });
});

/* GET api from username and postid. */
router.get('/:username/:postid', authenticate, (req, res, next) => {
    let postid = req.params.postid;
    if (isNaN(postid)) {
	return res.status(400).send('Error 400: cannot parse postid into integer');
    }
    postid = parseInt(postid);
    
    let collection = client.get().collection('Posts');
    collection.find({username: req.user, postid: postid}).toArray((err, docs) => {
	if (err) {
	    return res.status(500).send('Error 500: could not retrieve from database.');
	}
	if (docs.length == 0) {
	    return res.status(404).send('Error 404: could not find the particular post.');
	}
	res.json(docs);
    });
});

/* POST api to save the particular post. */
router.post('/:username/:postid', authenticate, (req, res, next) => {
    let postid = req.params.postid;
    if (isNaN(postid)) {
	return res.status(400).send('Error 400: cannot parse postid into integer');
    }
    postid = parseInt(postid);

    let collection = client.get().collection('Posts');
    collection.find({username: req.user, postid: postid}).toArray((err, docs) => {
	if (err) {
	    return res.status(500).send('Error 500: could not retrieve from database.');
	}
	if (docs.length != 0) {
	    return res.status(400).send('Error 400: post already exists.');
	}
	if (! ("body" in req.body) || ! ("title" in req.body)) {
	    return res.status(400).send('Error 400: required parameters not in body.');
	}

	let currtime = new Date().getTime();
	
	collection.insertOne({
	    postid: postid,
	    username: req.user,
	    created: currtime,
	    modified: currtime,
	    title: req.body.title,
	    body: req.body.body
	}, (err, r) => {
	    if (err || r.insertedCount != 1) {
		return res.status(500).send('Error 500: could not insert into database.');
	    }
	    res.sendStatus(201);
	});
    });
});

/* PUT api to save the particular post. */
router.put('/:username/:postid', authenticate, (req, res, next) => {
	let postid = req.params.postid;
    if (isNaN(postid)) {
	return res.status(400).send('Error 400: cannot parse postid into integer');
    }
    postid = parseInt(postid);

    if (! ("body" in req.body) || ! ("title" in req.body)) {
	return res.status(400).send('Error 400: required parameters not in body.');
    }

    let collection = client.get().collection('Posts');
    let currtime = new Date().getTime();

    collection.updateOne({username: req.user, postid: postid}, {$set: {
	modified: currtime,
	title: req.body.title,
	body: req.body.body
    }}, (err, r) => {
	if (err) {
	    return res.status(500).send('Error 500: could not retrieve from database.');
	}
	if (r.matchedCount < 1) {
	    return res.status(400).send('Error 400: post does not exist.');
	}
	if (r.modifiedCount != 1) {
	    return res.status(500).send('Error 500: could not update post in database.');
	}

	res.sendStatus(200);
    });
});

/* DELETE api from username and postid. */
router.delete('/:username/:postid', authenticate, (req, res, next) => {
    let postid = req.params.postid;
    if (isNaN(postid)) {
			return res.status(400).send('Error 400: cannot parse postid into integer');
    }
    postid = parseInt(postid);
    
    let collection = client.get().collection('Posts');
    collection.deleteMany({username: req.user, postid: postid}, (err, r) => {
			if (err) {
				return res.status(500).send('Error 500: could not retrieve from database.');
			}
			if (r.deletedCount < 1) {
				return res.status(400).send('Error 400: could not find/delete such post.');
			}
			res.sendStatus(204);
    });
});

module.exports = router;
