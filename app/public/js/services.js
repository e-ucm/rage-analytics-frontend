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
        return $resource(CONSTANTS.PROXY + '/games/:gameId', { gameId: '@_id' }, {
            my: { method: 'GET', isArray: true , url: CONSTANTS.PROXY + '/games/my' },
            public: { method: 'GET', isArray: true , url: CONSTANTS.PROXY + '/games/public' },
            update: { method: 'PUT' }
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
        }, {
            forGame: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/games/:gameId/versions' },
            update: { method: 'POST' } // TODO Update this to PUT or update all the others to POST
        });
    }
]);

services.factory('Classes', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/classes/:classId', {
            classId: '@_id'
        }, {
            my: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/classes/my' },
            update: { method: 'PUT' }
        });
    }
]);

services.factory('Courses', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/courses', {}, {
            all: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/courses'}
        });
    }
]);

var loadingStatus = {};

services.factory('Activities', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        var Activity = $resource(CONSTANTS.PROXY + '/activities/:activityId', {
            activityId: '@_id',
            versionId: '@versionId',
            gameId: '@gameId'
        }, {
            my: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/activities/my' },
            forClass: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/classes/:classId/activities/my' },
            forGame: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/games/:gameId/versions/:versionId/activities/my' },
            update: { method: 'PUT' }
        });

        Object.defineProperty(Activity.prototype, 'loading', {
            get: function loading() {
                return loadingStatus[this._id];
            },
            set: function loading(value) {
                loadingStatus[this._id] = value;
            }
        });

        return Activity;
    }
]);

services.factory('Results', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/activities/:id/results/:resultId', {
            resultId: '@_id'
        });
    }
]);

services.factory('Role', ['$localStorage',
    function ($localStorage) {
        return {
            isUser: function () {
                return $localStorage && $localStorage.user;
            },
            isAdmin: function () {
                return $localStorage.user && $localStorage.user.roles && $localStorage.user.roles.indexOf('admin') !== -1;
            },
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
