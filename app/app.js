'use strict';

var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    logger = require('morgan');

var app = express();
app.config = require((process.env.NODE_ENV === 'test') ? './config-test' : './config');

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev', {
    skip: function (req, res) { return false;}
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.sendDefaultSuccessMessage = function () {
        res.json({
            message: 'Success.'
        });
    };
    next();
});

app.use('/', require('./viewRoutes'));
app.use('/health', require('./health'));


// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});

module.exports = app;
