let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

let apiRouter = require('./routes/api');
let blogRouter = require('./routes/blog');
let loginRouter = require('./routes/login');
let editorRouter = require('./routes/editor');
let app = express();

let client = require('./db');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', editorRouter);
app.use('/blog', blogRouter);
app.use('/login', loginRouter);
app.use('/api', apiRouter);
app.use('/editor', editorRouter);

app.use(express.static(path.join(__dirname, 'public')));

// Connect to Mongo on start
client.connect('mongodb://localhost:27017/', function (err) {
    if (err) {
        console.log('Unable to connect to Mongo.');
        process.exit(1);
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.status + ' ' + err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
