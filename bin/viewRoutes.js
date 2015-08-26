'use strict';

var express = require('express'),
    router = express.Router();

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

module.exports = router;