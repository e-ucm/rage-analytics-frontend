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

angular.module('devVisualizatorApp', ['ngStorage', 'services'])
    .controller('DevVisualizatorCtrl', ['$scope', '$location', '$http', '$window', '$localStorage', 'Games',
        'Versions', 'Role', 'CONSTANTS', '$sce', 'QueryParams',
        function ($scope, $location, $http, $window, $localStorage, Games, Versions, Role, CONSTANTS, $sce, QueryParams) {
            $scope.$storage = $localStorage;

            $scope.isDeveloper = function () {
                return Role.isDeveloper();
            };

            var versionId = QueryParams.getQueryParam('version');
            $scope.gameId = QueryParams.getQueryParam('game');

            $scope.showVisualization = function () {
                versionId = QueryParams.getQueryParam('version');
                $scope.gameId = QueryParams.getQueryParam('game');

                $http.get(CONSTANTS.PROXY + '/kibana/visualization/list/dev/' + $scope.gameId)
                    .success(function(data) {

                        var panels = [];
                        var uiStates = {};

                        // Add index
                        $http.post(CONSTANTS.PROXY + '/kibana/index/' + $scope.gameId + '/' + versionId, {})
                            .success(function(data) {

                            }).error(function (data, status) {
                            console.error('Error on post /kibana/index/' + $scope.gameId + '/' + versionId + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });

                        // Add dashboard
                        var numPan = 1;
                        data.forEach(function (visualizationId) {

                            $http.post(CONSTANTS.PROXY + '/kibana/visualization/activity/' + $scope.gameId + '/' + visualizationId + '/' + versionId,
                                {}).success(function(result) {
                                panels.push('{\"id\":\"' + visualizationId + '_' + versionId +
                                    '\",\"type\":\"visualization\",\"panelIndex\":' + numPan + ',' +
                                    '\"size_x\":6,\"size_y\":4,\"col\":' + (1 + (numPan - 1 % 2)) + ',\"row\":' +
                                    (numPan + 1 / 2) + '}');
                                uiStates['P-' + numPan] = {vis: {legendOpen: false}};
                                numPan++;

                                if (numPan > data.length) {
                                    var dashboard = {
                                        title: 'dashboard_' + versionId,
                                        hits: 0,
                                        description: '',
                                        panelsJSON: '[' + panels.toString() + ']',
                                        optionsJSON: '{"darkTheme":false}',
                                        uiStateJSON: JSON.stringify(uiStates),
                                        version: 1,
                                        timeRestore: true,
                                        timeTo: 'now',
                                        timeFrom: 'now-7d',
                                        refreshInterval: {
                                            display: '10 seconds',
                                            pause: false,
                                            section: 1,
                                            value: 10000
                                        },
                                        kibanaSavedObjectMeta: {
                                            searchSourceJSON: '{"filter":[{"query":{"query_string":{"query":"*","analyze_wildcard":true}}}]}'
                                        }
                                    };
                                    $http.post(CONSTANTS.PROXY + '/kibana/dashboard/activity/' + versionId, dashboard)
                                        .success(function(data) {
                                            $scope.dashboardLink = getDashboardLink();
                                        }).error(function (data, status) {
                                        console.error('Error on post /kibana/dashboard/activity/' + versionId + ' ' +
                                            JSON.stringify(data) + ', status: ' + status);
                                    });
                                }
                            }).error(function (data, status) {
                                console.error('Error on post /kibana/visualization/activity/' + visualizationId + '/' + versionId + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            });
                        });
                    }).error(function (data, status) {
                    console.error('Error on post /kibana/visualization/list/' + $scope.gameId + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            var getDashboardLink = function() {
                var url = CONSTANTS.KIBANA + '/app/kibana#/dashboard/dashboard_' +
                    QueryParams.getQueryParam('version') + '?embed=true_g=(refreshInterval:(display:\'5%20seconds\',' +
                    'pause:!f,section:1,value:5000),time:(from:now-1h,mode:quick,to:now))';
                if (url.startsWith('localhost')) {
                    url = 'http://' + url;
                }
                document.getElementById('dashboardIframe').contentWindow.location.reload();
                return $sce.trustAsResourceUrl(url);
            };

        }
    ]);