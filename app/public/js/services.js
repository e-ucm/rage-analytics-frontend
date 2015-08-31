'use strict';

var services = angular.module('services', ['ngResource', 'ngStorage']);

services.factory('Games', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/games', {
            gameId: '@_id'
        });
    }
]);

services.factory('Versions', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/games/:gameId/versions/:versionId', {
            versionId: '@_id',
            gameId: '@gameId'
        });
    }
]);

services.factory('Sessions', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/games/:gameId/versions/:versionId/sessions', {
            sessionId: '@_id',
            versionId: '@versionId',
            gameId: '@gameId'
        });
    }
]);

services.factory('Role', ['$localStorage',
    function ($localStorage) {
        return {
            isTeacher: function () {
                return $localStorage.user.roles && $localStorage.user.roles.indexOf('teacher') !== -1;
            },
            isDeveloper: function () {
                return $localStorage.user.roles && $localStorage.user.roles.indexOf('developer') !== -1;
            },
            isStudent: function () {
                return $localStorage.user.roles && $localStorage.user.roles.indexOf('student') !== -1;
            }
        };
    }
]);
