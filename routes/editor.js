let express = require('express');
let router = express.Router();
let jwt = require('jsonwebtoken');
let path = require('path');

const secretKey = 'C-UFRaksvPKhx1txJYFcut3QGxsafPmwCY6SCly3G6c';

/* GET home page. */
router.get('/', (req, res, next) => {
  const token = req.cookies.jwt || '';
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (! err) {
        req.user = decoded.usr;
        res.sendFile(path.join(__dirname, '../public/editor/index.html'));
      } else {
        res.redirect('/login?redirect=/editor/');
      }
    });
  } else {
    res.redirect('/login?redirect=/editor/');
  }
});

module.exports = router;
