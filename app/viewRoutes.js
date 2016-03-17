/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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