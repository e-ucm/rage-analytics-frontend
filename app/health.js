'use strict';

var express = require('express'),
    router = express.Router();

/**
 * Checks the application health.
 */
router.get('/', function (req, res, next) {
    res.json({
        status: 'Available'
    });
});

module.exports = router;