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
            update: {
                method: 'PUT',
                transformRequest: function (data, headersGetter) {
                    if (data._id !== undefined) {
                        delete data._id;
                    }
                    if (data.created !== undefined) {
                        delete data.created;
                    }
                    return angular.toJson(data);
                }
            }
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
            update: {
                method: 'POST', // TODO Update this to PUT or update all the others to POST
                transformRequest: function (data, headersGetter) {
                    if (data._id !== undefined) {
                        delete data._id;
                    }
                    if (data.created !== undefined) {
                        delete data.created;
                    }
                    if (data.trackingCode !== undefined) {
                        delete data.trackingCode;
                    }
                    return angular.toJson(data);
                }
            }
        });
    }
]);

services.factory('Classes', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/classes/:classId', {
            classId: '@_id'
        }, {
            my: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/classes/my' },
            update: {
                method: 'PUT',
                transformRequest: function (data, headersGetter) {
                    if (data._id !== undefined) {
                        delete data._id;
                    }
                    if (data.created !== undefined) {
                        delete data.created;
                    }
                    return angular.toJson(data);
                }
            }
        });
    }
]);

services.factory('Courses', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/courses', {}, {
            all: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/courses'},
            update: {
                method: 'PUT',
                transformRequest: function (data, headersGetter) {
                    if (data._id !== undefined) {
                        delete data._id;
                    }
                    return angular.toJson(data);
                }
            }
        });
    }
]);

var loadingStatus = {};

services.factory('Activities', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        var Activity = $resource(CONSTANTS.PROXY + '/activities/:activityId', {
            activityId: '@_id',
            versionId: '@versionId',
            gameId: '@gameId',
            username: '@username'
        }, {
            my: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/activities/my' },
            forClass: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/classes/:classId/activities/my' },
            forGame: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/games/:gameId/versions/:versionId/activities/my' },
            update: {
                method: 'PUT',
                transformRequest: function (data, headersGetter) {
                    if (data._id !== undefined) {
                        delete data._id;
                    }
                    if (data.classId !== undefined) {
                        delete data.classId;
                    }
                    if (data.gameId !== undefined) {
                        delete data.gameId;
                    }
                    if (data.versionId !== undefined) {
                        delete data.versionId;
                    }
                    if (data.start !== undefined) {
                        delete data.versionId;
                    }
                    if (data.end !== undefined) {
                        delete data.versionId;
                    }
                    if (data.open !== undefined) {
                        delete data.open;
                    }
                    if (data.created !== undefined) {
                        delete data.created;
                    }
                    if (data.trackingCode !== undefined) {
                        delete data.trackingCode;
                    }
                    return angular.toJson(data);
                }
            },
            event: {
                method: 'POST',
                url: CONSTANTS.PROXY + '/activities/:activityId/event/:event',
                transformRequest: function (data, headersGetter) {
                    loadingStatus[data._id] = true;
                    return angular.toJson({_id: data._id, event: data.event});
                },
                transformResponse: function (data, headersGetter) {
                    var object = angular.fromJson(data);
                    console.info(data);
                    console.info(object);
                    if (object._id !== undefined) {
                        loadingStatus[object._id] = false;
                    }
                    return object;
                }
            },
            attempts: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/activities/:activityId/attempts'},
            myAttempts: { method: 'GET', url: CONSTANTS.PROXY + '/activities/:activityId/attempts/my'},
            userAttempts: { method: 'GET', url: CONSTANTS.PROXY + '/activities/:activityId/attempts/:username'}
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

services.factory('Groups', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/classes/:classId/groups', {classId: '@_id'}, {
            get: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/classes/:classId/groups'}
        });
    }
]);

services.factory('Groupings', ['$resource', 'CONSTANTS',
    function ($resource, CONSTANTS) {
        return $resource(CONSTANTS.PROXY + '/classes/:classId/groupings', {classId: '@_id'}, {
            get: { method: 'GET', isArray: true, url: CONSTANTS.PROXY + '/classes/:classId/groupings'}
        });
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
                return ($localStorage !== undefined) && ($localStorage.user !== undefined);
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
