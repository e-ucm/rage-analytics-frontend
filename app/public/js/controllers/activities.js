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

angular.module('activitiesApp', ['ngStorage', 'services'])
    .controller('ActivitiesCtrl', ['$scope', '$location', '$http', '$window', '$localStorage', 'Games', 'Versions',
        'Activities', 'Role', 'CONSTANTS', 'QueryParams',
        function ($scope, $location, $http, $window, $localStorage, Games, Versions, Activities, Role, CONSTANTS, QueryParams) {
            $scope.$storage = $localStorage;
            $scope.activity = {};
            $scope.class = {};
            $scope.game = {};

            var getActivities = function () {
                var queryClass = QueryParams.getQueryParam('class');
                var queryGame = QueryParams.getQueryParam('game');
                var queryVersion = QueryParams.getQueryParam('version');

                var route = '/activities/my';
                if (queryClass) {
                    route = '/classes/' + queryClass + '/activities/my';
                } else if (queryGame && queryVersion) {
                    route = '/games/' + queryGame + '/versions/' + queryVersion + '/activities/my';
                }

                $http.get(CONSTANTS.PROXY + route).success(function (data) {
                    $scope.activities = data;
                }).error(function (data, status) {
                    console.error('Error on get ' + route + ' ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            getActivities();
            $scope.classId = QueryParams.getQueryParam('class');
            $scope.loading = false;

            // LTI
            $scope.lti = {};
            $scope.lti.key = '';
            $scope.lti.secret = '';

            var myPrefix = $location.$$path.split('/')[3];
            $scope.lti.launch = $location.$$protocol + '://' + $location.$$host + ':' + $location.$$port +
                '/api/login/launch/' + myPrefix + '/' + CONSTANTS.PREFIX;

            $http.get(CONSTANTS.PROXY + '/lti/keyid/' + $scope.gameId + '/' + $scope.versionId + '/' + $scope.classId).success(function (data) {
                if (data && data.length > 0) {
                    $scope.lti.key = data[0]._id;
                    $scope.lti.secret = data[0].secret;
                }
            });

            $scope.createLtiKey = function () {
                if ($scope.lti.secret) {
                    $http.post(CONSTANTS.PROXY + '/lti', {
                        secret: $scope.lti.secret,
                        classId: $scope.classId,
                        versionId: $scope.versionId,
                        gameId: $scope.gameId
                    }).success(function (data) {
                        $scope.lti.key = data._id;
                    }).error(function (data, status) {
                        console.error('Error on get /lti' + JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };

            // FIN LTI

            var doCreateActivity = function(name, gameId, versionId, classId) {
                $http.post(CONSTANTS.PROXY + '/activities', {name: name, gameId: gameId,
                    versionId: versionId, classId: classId})
                    .success(function (activity) {
                        $http.get(CONSTANTS.PROXY + '/kibana/visualization/list/tch/' + gameId)
                            .success(function (data) {
                                var panels = [];
                                var uiStates = {};

                                // Add index
                                $http.post(CONSTANTS.PROXY + '/kibana/index/' + gameId + '/' + activity._id, {})
                                    .success(function (data) {

                                    }).error(function (data, status) {
                                    console.error('Error on post /kibana/index/' + gameId + '/' + activity._id + ' ' +
                                        JSON.stringify(data) + ', status: ' + status);
                                });

                                // Add dashboard
                                var numPan = 1;
                                if (data.length > 0) {
                                    data.forEach(function (visualizationId) {
                                        $http.post(CONSTANTS.PROXY + '/kibana/visualization/activity/' + gameId +
                                            '/' + visualizationId + '/' + activity._id, {}).success(function (result) {
                                            panels.push('{\"id\":\"' + visualizationId + '_' + activity._id +
                                                '\",\"type\":\"visualization\",\"panelIndex\":' + numPan + ',' +
                                                '\"size_x\":6,\"size_y\":4,\"col\":' + (1 + (numPan - 1 % 2)) + ',\"row\":' +
                                                (numPan + 1 / 2) + '}');
                                            uiStates['P-' + numPan] = {vis: {legendOpen: false}};
                                            numPan++;

                                            if (numPan > data.length) {
                                                var dashboard = {
                                                    title: 'dashboard_' + activity._id,
                                                    hits: 0,
                                                    description: '',
                                                    panelsJSON: '[' + panels.toString() + ']',
                                                    optionsJSON: '{"darkTheme":false}',
                                                    uiStateJSON: JSON.stringify(uiStates),
                                                    version: 1,
                                                    timeRestore: true,
                                                    timeTo: 'now',
                                                    timeFrom: 'now-1h',
                                                    refreshInterval: {
                                                        display: '5 seconds',
                                                        pause: false,
                                                        section: 1,
                                                        value: 5000
                                                    },
                                                    kibanaSavedObjectMeta: {
                                                        searchSourceJSON: '{"filter":[{"query":{"query_string":{"query":"*","analyze_wildcard":true}}}]}'
                                                    }
                                                };
                                                $http.post(CONSTANTS.PROXY + '/kibana/dashboard/activity/' + activity._id, dashboard)
                                                    .success(function (data) {
                                                        goToActivity(activity);
                                                    }).error(function (data, status) {
                                                    console.error('Error on post /kibana/dashboard/activity/' + activity._id + ' ' +
                                                        JSON.stringify(data) + ', status: ' + status);
                                                });
                                            }
                                        }).error(function (data, status) {
                                            console.error('Error on post /kibana/visualization/activity/' + visualizationId + '/' + activity._id + ' ' +
                                                JSON.stringify(data) + ', status: ' + status);
                                        });
                                    });
                                } else {
                                    goToActivity(activity);
                                }
                            }).error(function (data, status) {
                            console.error('Error on post /kibana/visualization/list/' + gameId + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });
                    });
            };

            $scope.createActivity = function () {
                if (!$scope.activity.gameId && !QueryParams.getQueryParam('game')) {
                    // It's necessary to pick a game
                    return;
                }

                if (!$scope.activity.classId && !QueryParams.getQueryParam('class')) {
                    // It's necessary to pick a class
                    return;
                }

                var activityName = $scope.activity.name ? $scope.activity.name : 'New activity';
                $scope.gameId = $scope.activity.gameId ? $scope.activity.gameId : QueryParams.getQueryParam('game');
                $scope.versionId = QueryParams.getQueryParam('version');
                $scope.classId = $scope.activity.classId ? $scope.activity.classId : QueryParams.getQueryParam('class');

                if (!$scope.versionId) {
                    $http.get(CONSTANTS.PROXY + '/games/' + $scope.gameId + '/versions')
                        .success(function (data) {
                            $scope.versionId = data[0]._id;
                            doCreateActivity(activityName, $scope.gameId, $scope.versionId, $scope.classId);
                        }).error(function (data, status) {
                            console.error('Error on get /games/' + QueryParams.getQueryParam('game') + '/versions/' +
                                QueryParams.getQueryParam('version') + '/activities' + JSON.stringify(data) + ', status: ' + status);
                        });
                } else {
                    doCreateActivity(activityName, $scope.gameId, $scope.versionId, $scope.classId);
                }
            };

            var goToActivity = function(activity) {
                $window.location = 'data' + '?activity=' + activity._id;
            };

            $scope.isTeacher = function () {
                return Role.isTeacher();
            };

            $scope.startActivity = function (activity) {
                $scope.loading = true;
                $http.post(CONSTANTS.PROXY + '/activities/' + activity._id + '/event/start').success(function (s) {
                    $scope.loading = false;
                    $scope.selectedActivity = s;
                    getActivities();
                }).error(function (data, status) {
                    console.error('Error on get /activities/' + activity._id + '/event/start ' +
                        JSON.stringify(data) + ', status: ' + status);
                    $scope.loading = false;
                });
            };

            $scope.endActivity = function (activity) {
                $scope.loading = true;
                $http.post(CONSTANTS.PROXY + '/activities/' + activity._id + '/event/end').success(function (s) {
                    $scope.loading = false;
                    $scope.selectedActivity = s;
                    getActivities();
                }).error(function (data, status) {
                    console.error('Error on get /activities/' + activity._id + '/event/end ' +
                        JSON.stringify(data) + ', status: ' + status);
                    $scope.loading = false;
                });
            };

            $scope.activityOpenedError = '';
            $scope.deleteActivity = function (activityObj) {
                if (activityObj) {
                    $http.delete(CONSTANTS.PROXY + '/activities/' + activityObj._id).success(function () {
                        $scope.activityOpenedError = '';
                        getActivities();
                    }).error(function (data, status) {
                        $scope.activityOpenedError = data;
                        console.error('Error on delete /activities/' + activityObj._id + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };

            $scope.activityState = function (activity) {
                return activity && activity.start && !activity.end;
            };

        }
    ]);