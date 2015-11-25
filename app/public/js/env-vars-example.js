'use strict';

var envVars = angular.module('env-vars', []);

envVars.constant('CONSTANTS', {
    APIPATH: location.protocol + '//' + location.hostname + ':3000/api',
    PREFIX: '{{appPrefix}}',
    PROXY: location.protocol + '//' + location.hostname + ':3000/api/proxy/{{appPrefix}}'
});

