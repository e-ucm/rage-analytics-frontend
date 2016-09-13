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

angular.module('classApp', ['ngStorage', 'services'])
    .controller('ClassCtrl', ['$scope', '$location', '$http', '$window', '$localStorage', 'Games', 'Versions', 'Sessions', 'Role', 'CONSTANTS', 'QueryParams',
        function ($scope, $location, $http, $window, $localStorage, Games, Versions, Sessions, Role, CONSTANTS, QueryParams) {
            $scope.$storage = $localStorage;
            $scope.session = {};
            $scope.class = {};

            var getSessions = function () {
                $http.get(CONSTANTS.PROXY + '/games/' + QueryParams.getQueryParam('game') + '/versions/' +
                    QueryParams.getQueryParam('version') + '/sessions/my').success(function (data) {
                    $scope.sessions = data;
                }).error(function (data, status) {
                    console.error('Error on get /games/' + QueryParams.getQueryParam('game') + '/versions/' +
                        QueryParams.getQueryParam('version') + '/sessions/my' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            getSessions();
            $scope.gameId = QueryParams.getQueryParam('game');
            $scope.versionId = QueryParams.getQueryParam('version');
            $scope.loading = false;

            $scope.createSession = function () {
                var className = $scope.class.name ? $scope.class.name : 'New class';
                $http.post(CONSTANTS.PROXY + '/games/' + QueryParams.getQueryParam('game') + '/versions/' +
                    QueryParams.getQueryParam('version') + '/sessions', {name: className}).success(function (session) {

                        $http.get(CONSTANTS.PROXY + '/kibana/visualization/list/tch' + $scope.gameId)
                            .success(function(data) {

                                var panels = [];
                                var uiStates = {};

                                // Add index
                                $http.post(CONSTANTS.PROXY + '/kibana/index/' + $scope.gameId + '/' + session._id, {})
                                    .success(function(data) {

                                    }).error(function (data, status) {
                                    console.error('Error on post /kibana/index/' + $scope.gameId + '/' + session._id + ' ' +
                                        JSON.stringify(data) + ', status: ' + status);
                                });

                                // Add dashboard
                                var numPan = 1;
                                data.forEach(function (visualizationId) {
                                    $http.post(CONSTANTS.PROXY + '/kibana/visualization/session/' + $scope.gameId + '/' + visualizationId + '/' + session._id,
                                        {}).success(function(result) {
                                            panels.push('{\"id\":\"' + visualizationId + '_' + session._id +
                                                '\",\"type\":\"visualization\",\"panelIndex\":' + numPan + ',' +
                                                '\"size_x\":6,\"size_y\":4,\"col\":'+(1+(numPan-1%2))+',\"row\":' +
                                                (numPan+1/2) + '}');
                                            uiStates['P-' + numPan] = {vis: {legendOpen: false}};
                                            numPan++;

                                            if (numPan > data.length) {
                                                var dashboard = {
                                                    title: 'dashboard_' + session._id,
                                                    hits: 0,
                                                    description: '',
                                                    panelsJSON: '[' + panels.toString() + ']',
                                                    optionsJSON: '{"darkTheme":false}',
                                                    uiStateJSON: JSON.stringify(uiStates),
                                                    version: 1,
                                                    timeRestore: true,
                                                    timeTo: "now",
                                                    timeFrom: "now-1h",
                                                    kibanaSavedObjectMeta: {
                                                        searchSourceJSON: '{"filter":[{"query":{"query_string":{"query":"*","analyze_wildcard":true}}}]}'
                                                    }
                                                };
                                                $http.post(CONSTANTS.PROXY + '/kibana/dashboard/session/' + session._id, dashboard)
                                                    .success(function(data) {
                                                        $window.location = 'data' + '?game=' + QueryParams.getQueryParam('game') + '&version=' +
                                                            QueryParams.getQueryParam('version') + '&session=' + session._id;
                                                    }).error(function (data, status) {
                                                    console.error('Error on post /kibana/dashboard/session/' + session._id + ' ' +
                                                        JSON.stringify(data) + ', status: ' + status);
                                                });
                                            }
                                        }).error(function (data, status) {
                                            console.error('Error on post /kibana/visualization/session/' + visualizationId + '/' + session._id + ' ' +
                                                JSON.stringify(data) + ', status: ' + status);
                                        });
                                });
                            }).error(function (data, status) {
                                console.error('Error on post /kibana/visualization/list/' + $scope.gameId + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            });
                    }).error(function (data, status) {
                    console.error('Error on get /games/' + QueryParams.getQueryParam('game') + '/versions/' +
                        QueryParams.getQueryParam('version') + '/sessions' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.isTeacher = function () {
                return Role.isTeacher();
            };

            $scope.startSession = function (session) {
                $scope.loading = true;
                $http.post(CONSTANTS.PROXY + '/sessions/' + session._id + '/event/start').success(function (s) {
                    $scope.loading = false;
                    $scope.selectedSession = s;
                    getSessions();
                }).error(function (data, status) {
                    console.error('Error on get /games/' + '/sessions/' + session._id + '/event/start ' +
                        JSON.stringify(data) + ', status: ' + status);
                    $scope.loading = false;
                });
            };

            $scope.endSession = function (session) {
                $scope.loading = true;
                $http.post(CONSTANTS.PROXY + '/sessions/' + session._id + '/event/end').success(function (s) {
                    $scope.loading = false;
                    $scope.selectedSession = s;
                    getSessions();
                }).error(function (data, status) {
                    console.error('Error on get /games/' + '/sessions/' + session._id + '/event/end ' +
                        JSON.stringify(data) + ', status: ' + status);
                    $scope.loading = false;
                });
            };

            $scope.sessionState = function (session) {
                return session && session.start && !session.end;
            };

        }
    ]);