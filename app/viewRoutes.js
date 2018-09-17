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

var getBasePath = function(req) {
    if (req.protocol === 'https') {
        return 'https://' + req.headers['x-forwarded-host'];
    }

    var proto = req.headers['x-forwarded-proto'];
    return proto + '://' + req.headers['x-forwarded-host'];
};

router.get('/loginbyplugin', function (req, res) {
    console.log('loginbyplugin');
    res.render('view/loginplugin', {user: JSON.stringify(req.query), basePath: getBasePath(req)});
});

router.get('/view/:page', function (req, res) {
    res.render('view/' + req.param('page'), {basePath: getBasePath(req)});
});

router.get('*', function (req, res) {
    res.render('page', {basePath: getBasePath(req)});
});

/* A
router.get('/', function (req, res) {
    res.render('login', {basePath: getBasePath(req)});
});

router.get('/signup', function (req, res) {
    res.render('signup', {basePath: getBasePath(req)});
});

router.get('/login', function (req, res) {
    res.render('login', {basePath: getBasePath(req)});
});

router.get('/logout', function (req, res) {
    res.render('home', {basePath: getBasePath(req)});
});

router.get('/home', function (req, res) {
    res.render('home', {basePath: getBasePath(req)});
});

router.get('/class', function (req, res) {
    res.render('class', {basePath: getBasePath(req)});
});

router.get('/classactivity', function (req, res) {
    res.render('classActivity', {basePath: getBasePath(req)});
});

router.get('/gameactivity', function (req, res) {
    res.render('gameActivity', {basePath: getBasePath(req)});
});

router.get('/data', function (req, res) {
    res.render('data', {basePath: getBasePath(req)});
});

router.get('/loginbyplugin/', function (req, res) {
    res.render('loginplugin', {user: JSON.stringify(req.query), basePath: getBasePath(req)});
});
*/

module.exports = router;