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

var services = angular.module('services', ['ngResource', 'ngStorage']);

services.factory('Games', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/games', {
            gameId: '@_id'
        });
    }
]);

services.factory('Analysis', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/analysis/:versionId', {
            versionId: '@_id'
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

services.factory('Classes', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/games/:gameId/versions/:versionId/classes', {
            classId: '@_id',
            versionId: '@versionId',
            gameId: '@gameId'
        });
    }
]);

services.factory('Sessions', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/games/:gameId/versions/:versionId/classes/:classId/sessions', {
            sessionId: '@_id',
            classId: '@classId',
            versionId: '@versionId',
            gameId: '@gameId'
        });
    }
]);

services.factory('SessionsId', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/sessions/:id');
    }
]);

services.factory('Results', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/sessions/:id/results/:resultId', {
            resultId: '@_id'
        });
    }
]);

services.factory('Role', ['$localStorage',
    function ($localStorage) {
        return {
            isTeacher: function () {
                return $localStorage.user && $localStorage.user.roles && $localStorage.user.roles.indexOf('teacher') !== -1;
            },
            isDeveloper: function () {
                return $localStorage.user && $localStorage.user.roles && $localStorage.user.roles.indexOf('developer') !== -1;
            },
            isStudent: function () {
                return $localStorage.user && $localStorage.user.roles && $localStorage.user.roles.indexOf('student') !== -1;
            }
        };
    }
]);


services.factory('QueryParams', [
    function () {

        return {
            getQueryParam: function (param) {
                var result = window.location.search.match(
                    new RegExp('(\\?|&)' + param + '(\\[\\])?=([^&]*)')
                );

                return result ? result[3] : false;
            }
        };
    }
]);
