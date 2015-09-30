'use strict';

var envVars = angular.module('env-vars', []);

envVars.constant('CONSTANTS', {
    APIPATH: '{{apiPath}}',
    PREFIX: '{{appPrefix}}',
    PROXY: '{{apiPath}}/proxy/{{appPrefix}}'
});
