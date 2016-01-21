#!/usr/bin/env node
'use strict';

/**
 * This file issues the needed requests to set up the gleaner application
 * with the roles defined in the 'a-frontend-routes.js' file.
 *
 */

var Path = require('path');
var request = require('request');
var config = require(Path.resolve(__dirname, '../app/config.js'));
var appData = require(Path.resolve(__dirname, '../app/a-frontend-routes.js')).app;

var baseUsersAPI = config.a2.a2ApiPath;

request.post(baseUsersAPI + 'login', {
        form: {
            username: config.a2.a2AdminUsername,
            password: config.a2.a2AdminPassword
        },
        json: true
    },
    function (err, httpResponse, body) {
        if (err) {
            console.error(err);
            if (err.errno && err.errno.indexOf('ECONNREFUSED') > -1) {
                console.error('Could not connect to A2 to login!');
                return process.exit(-1);
            }
            console.log('Did not register the frontend with A2, continuing anyway!');
            return process.exit(0);
        }

        appData.name = config.projectName;
        appData.prefix =  config.a2.a2Prefix;
        appData.host = 'http://' + config.myHost + ':' + config.port;

        request({
            uri: baseUsersAPI + 'applications',
            method: 'POST',
            body: appData,
            json: true,
            headers: {
                Authorization: 'Bearer ' + body.user.token
            }
        }, function (err, httpResponse, body) {
            if (err) {
                console.error(err);
                if (err.errno && err.errno.indexOf('ECONNREFUSED') > -1) {
                    console.error('Could not connect to A2 to register the frontend application!');
                    return process.exit(-1);
                }
                console.log('Did not register the backend with A2, continuing anyway!');
                return process.exit(0);
            }

            if (body.message) {
                console.error('Error', body.message,
                    'Did not register the backend with A2, continuing anyway!');
            } else {
                console.log('Application and roles setup complete.');
            }

            process.exit(0);
        });
    });


