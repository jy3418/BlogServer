let express = require('express');

let commonmark = require('commonmark');
let dbSetup = require('../db');
const assert = require('assert');

let commRead = new commonmark.Parser();
let commWrit = new commonmark.HtmlRenderer();

let router = express.Router();

//for /blog/:username/:postid
router.get('/:username/:postid', function(req, res, next) {
	//console.log('testing for username and postid');
	let username = req.params.username;
	//console.log(username);
	let postid = parseInt(req.params.postid, 10);
	//console.log(postid);
	//check for postid being NaN (from Piazza)
	if (isNaN(postid)) {
		console.log("should send 400 since postid isn't int");
		res.status(400).send("Error 400: Invalid Parameter/Bad Request!");
		return;
	}
	
	let allPosts = [];
	let nextid = null;
	let db = dbSetup.get();
	if (db == null) {
		console.log("database is null");
	}
	db.collection('Posts').findOne({
		'username': username,
		'postid': postid
	}).then(function (result) {
		if (result != null) {
			let title = result.title;
			let body = result.body;
			let parsedTitle = commRead.parse(title);
			let writtenTitle = commWrit.render(parsedTitle);
			let parsedBody = commRead.parse(body);
			let writtenBody = commWrit.render(parsedBody);
			let creatStamp = new Date(result.created);
			let modStamp = new Date(result.modified);
			let post = {
				title: writtenTitle,
				body: writtenBody,
				created: creatStamp,
				modified: modStamp
			};
			//console.log(post);
			allPosts.push(post);
    } else {
			console.log("should send 404 for invalid username or postid");
			res.status(404).send("Error 404: Does not exist!");
			return;
		}
		res.render('blog', {
			username: username,
			allPosts: allPosts,
			nextid: nextid
		});
	});
});

//for /blog/:username
router.get('/:username', function(req, res, next) {
	//console.log("testing for username only");
	let username = req.params.username;
	let startPlace = req.query.start;
	if (startPlace != null) {
		startPlace = parseInt(startPlace, 10);
	}
	
	let allPosts = [];
	let nextid = null;
	let db = dbSetup.get();
	if (db == null) {
		console.log("database is null");
	}
	//dealing with starting at a non first page
	if (startPlace != null) {
		db.collection('Posts').find({ 
			'username': username,
			'postid': { $gte: startPlace }
		}).sort({ 'postid': 1 }).limit(6).toArray(function (err, documents) {
			assert.equal(null, err);
			
			//if there are nothing then that should mean that the username wasn't valid
			if (documents.length == 0) {
				console.log("should send 404 for not valid username or invalid starting place");
				res.status(404).send("Error 404: Does not exist!");
				return;
			}
			
			if (documents.length == 6) {
				nextid = documents[5].postid;			//because we took the first 6, we can take the postid of the 6th as the nextid
				documents = documents.slice(0, 5);	//then slice to the first 5 only
			}
			
			for (let d of documents) {
				if (d != null) {
					let title = d.title;
					let body = d.body;
					let parsedTitle = commRead.parse(title);
					let writtenTitle = commWrit.render(parsedTitle);
					let parsedBody = commRead.parse(body);
					let writtenBody = commWrit.render(parsedBody);
					let creatStamp = new Date(d.created);
					let modStamp = new Date(d.modified);
					let post = {
						title: writtenTitle,
						body: writtenBody,
						created: creatStamp,
						modified: modStamp
					};
					//console.log(post);
					allPosts.push(post);
				} else {
					console.log("should send 404");
					res.status(404).send("Error 404: Does not exist!");
					return;
				}
			}
			res.render('blog', {
				username: username,
				allPosts: allPosts,
				nextid: nextid
			});
		});
	} else {	//pretty much the same thing except we start at the first post
		db.collection('Posts').find({ 'username': username }).sort({ 'postid': 1 }).limit(6).toArray(function (err, documents) {
			assert.equal(null, err);
			
			//if there are nothing then that should mean that the username wasn't valid
			if (documents.length == 0) {
				console.log("should send 404 for not valid username");
				res.status(404).send("Error 404: Does not exist!");
				return;
			}
			
			if (documents.length == 6) {
				nextid = documents[5].postid;			//because we took the first 6, we can take the postid of the 6th as the nextid
				documents = documents.slice(0, 5);	//then slice to the first 5 only
			}
			
			for (let d of documents) {
				if (d != null) {
					let title = d.title;
					let body = d.body;
					let parsedTitle = commRead.parse(title);
					let writtenTitle = commWrit.render(parsedTitle);
					let parsedBody = commRead.parse(body);
					let writtenBody = commWrit.render(parsedBody);
					let creatStamp = new Date(d.created);
					let modStamp = new Date(d.modified);
					let post = {
						title: writtenTitle,
						body: writtenBody,
						created: creatStamp,
						modified: modStamp
					};
					//console.log(post);
					allPosts.push(post);
				} else {
					//probably shouldn't need these but have for safeguard
					console.log("should send 404");
					res.status(404).send("Error 404: Does not exist!");
					return;
				}
			}
			res.render('blog', {
				username: username,
				allPosts: allPosts,
				nextid: nextid
			});
		});
	}
});

module.exports = router;