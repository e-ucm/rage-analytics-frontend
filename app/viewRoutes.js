'use strict';

var express = require('express'),
    router = express.Router();

router.get('/', function (req, res) {
    res.render('login');
});

router.get('/signup', function (req, res) {
    res.render('signup');
});

router.get('/login', function (req, res) {
    res.render('login');
});

router.get('/logout', function (req, res) {
    res.render('home');
});

router.get('/home', function (req, res) {
    res.render('home');
});

router.get('/class', function (req, res) {
    res.render('class');
});

router.get('/data', function (req, res) {
    res.render('data');
});

module.exports = router;