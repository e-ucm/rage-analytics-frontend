'use strict';

var envVars = angular.module('env-vars', []);

envVars.constant('CONSTANTS', {
    APIPATH: location.origin + '/api',
    PREFIX: '{{appPrefix}}',
    PROXY: location.origin + '/api/proxy/{{appPrefix}}'
});

