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
    .controller('ActivityListCtrl', ['$rootScope', '$scope', '$attrs', '$interpolate', '$http', 'Activities', 'Games', 'Versions', 'Classes', 'CONSTANTS',
        function ($rootScope, $scope, $attrs, $interpolate, $http, Activities, Games, Versions, Classes, CONSTANTS) {

            $scope.activityOpenedError = '';
            $scope.activityCreatedError = '';
            $scope.activity = {};

            var loadByClass = function (classId) {
                $scope.classId = classId;
                $scope.games = Games.public();
                $scope.activities = Activities.forClass({classId: $scope.classId});
            };

            var loadByGameAndVersion = function (gameId, versionId) {
                $scope.gameId = gameId;
                $scope.versionId = versionId;
                $scope.classes = Classes.my();
                $scope.activities = Activities.forGame({gameId: $scope.gameId, versionId: $scope.versionId});
            };

            var loadAll = function () {
                $scope.activities = Activities.my();
                $scope.classes = Classes.my();
                $scope.games = Games.public();
            };

            if (!$attrs.classid && !$attrs.gameid && !$attrs.versionid) {
                loadAll();
            }

            $attrs.$observe('classid', function () {
                if ($attrs.classid) {
                    loadByClass($attrs.classid);
                }
            });

            $attrs.$observe('gameid', function () {
                if ($attrs.gameid && $attrs.versionid) {
                    loadByGameAndVersion($attrs.gameid, $attrs.versionid);
                }
            });

            $attrs.$observe('versionid', function () {
                if ($attrs.gameid && $attrs.versionid) {
                    loadByGameAndVersion($attrs.gameid, $attrs.versionid);
                }
            });

            $scope.$on('refreshClasses', function () {
                Classes.my().$promise
                    .then(function (classes) {
                        $scope.classes = classes;
                    })
                    .then(function () {
                        Activities.my().$promise.then(function (activities) {
                            $scope.activities = activities;
                        });
                    });
            });

            $scope.$on('refreshGames', function () {
                Games.public().$promise.then(function (games) {
                    $scope.games = games;
                });
                Activities.my().$promise.then(function (activities) {
                    $scope.activities = activities;
                });
            });

            $scope.$on('refreshActivities', function () {
                Activities.my().$promise.then(function (activities) {
                    $scope.activities = activities;
                });
            });


            $scope.createActivity = function () {
                var activityName = $scope.activity.name ? $scope.activity.name : 'New activity';
                var classId = $scope.classId ? $scope.classId : $scope.activity.classId;
                var gameId = $scope.gameId ? $scope.gameId : $scope.activity.gameId;
                var versionId = $scope.versionId;

                $scope.activityCreatedError = '';
                if (!gameId) {
                    // It's necessary to pick a game
                    $scope.activityCreatedError = 'Please, select a game.';
                    return;
                }

                if (!classId) {
                    // It's necessary to pick a class
                    $scope.activityCreatedError = 'Please, select a class.';
                    return;
                }

                if (!versionId) {
                    Versions.forGame({gameId: gameId}).$promise.then(function (versions) {
                        if (versions && versions.length > 0 && versions[0]._id) {
                            doCreateActivity(activityName, gameId, versions[0]._id, classId);
                        } else {
                            console.log('No version for the selected gameId');
                        }
                    });
                } else {
                    doCreateActivity(activityName, gameId, versionId, classId);
                }

            };

            $scope.type = {
                offline: false
            };
            var doCreateActivity = function (activityName, gameId, versionId, classId) {
                var activity = new Activities();
                activity.name = activityName;
                activity.gameId = gameId;
                activity.versionId = versionId;
                activity.classId = classId;

                if ($scope.type.offline) {
                    activity.offline = true;
                    activity.allowAnonymous = true;
                } else {
                    activity.offline = false;
                    activity.allowAnonymous = false;
                }
                activity.$save().then(function () {
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
                                                    $scope.goToActivity(activity);
                                                    $rootScope.$broadcast('refreshActivities');
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
                                $scope.goToActivity(activity);
                                $rootScope.$broadcast('refreshActivities');
                            }
                        }).error(function (data, status) {
                        console.error('Error on post /kibana/visualization/list/' + gameId + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                });
            };

            $scope.deleteActivity = function (activityObj) {
                if (activityObj) {
                    activityObj.$remove().then(function () {
                        $rootScope.$broadcast('refreshActivities');
                    });
                }
            };

            $scope.getClassById = function (_id) {
                var r = null;
                if ($scope.classes) {
                    $scope.classes.forEach(function (c) {
                        if (c._id === _id) {
                            r = c;
                        }
                    });
                }
                return r;
            };

            $scope.getGameById = function (_id) {
                var r = null;
                if ($scope.games) {
                    $scope.games.forEach(function (g) {
                        if (g._id === _id) {
                            r = g;
                        }
                    });
                }
                return r;
            };
        }
    ]);