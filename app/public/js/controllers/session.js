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

angular.module('sessionApp', ['myApp', 'ngStorage', 'services'])
    .config(['$locationProvider',
        function ($locationProvider) {
            $locationProvider.html5Mode(false);
        }
    ])
    .directive('reports', function () {
        return function (scope, element, attrs) {
            new RadialProgress(angular.element(element).children('.progress-marker')[0], scope.result.progress);
            new ColumnProgress(angular.element(element).children('.score-marker')[0], scope.result.score);
        };
    })
    .controller('SessionCtrl', ['$scope', '$location', 'SessionsId', 'Results', 'Versions', 'QueryParams', '$sce', 'CONSTANTS',
        function ($scope, $location, SessionsId, Results, Versions, QueryParams, $sce, CONSTANTS) {

            $scope.refreshResults = function () {
                var currentWarnings = $scope.selectedVersion.warnings;
                for (var i = 0; i < currentWarnings.length; ++i) {
                    var currentWarning = currentWarnings[i];
                    Results.save({
                            id: $scope.session._id
                        }, currentWarning,
                        function (users) {
                            calculateResults(users, currentWarning);
                        });
                }
            };

            $scope.session = SessionsId.get({
                id: QueryParams.getQueryParam('session')
            }, function () {
                $scope.version = Versions.get({
                    gameId: $scope.session.gameId,
                    versionId: $scope.session.versionId
                }, function () {
                    $scope.refreshResults();
                    if (!$scope.session.end) {
                        setInterval(function () {
                            $scope.refreshResults();
                        }, 10000);
                    }
                });
            });

            var evalExpression = function (expression, defaultValue) {
                try {
                    return eval(expression) || defaultValue;
                } catch (err) {
                    return defaultValue;
                }
            };

            $scope.dashboardLink = function () {
                var url = CONSTANTS.KIBANA + '/app/kibana#/dashboard/dashboard_' +
                    QueryParams.getQueryParam('session') + "?embed=true_g=(refreshInterval:(display:'5%20seconds'," +
                    "pause:!f,section:1,value:5000),time:(from:now-1h,mode:quick,to:now))";
                if (url.startsWith('localhost')) {
                    url = 'http://' + url;
                }
                return $sce.trustAsResourceUrl(url);
            };

            var calculateResults = function (users, warning) {
                if (!$scope.warnings) {
                    $scope.warnings = [];
                }

                $scope.warnings.push({
                    users: users,
                    warning: warning.message
                });
            };

            $scope.updateLevels = function (player) {
                var levels = player.levels || [];

                player.alerts.forEach(function (alert) {
                    levels[alert.id] = alert.level;
                });
                delete player.alerts;
                player.levels = levels;
                player.$save({id: $scope.session._id}, function () {
                    $scope.player = null;
                    $scope.refreshResults();
                });
            };
        }
    ]);