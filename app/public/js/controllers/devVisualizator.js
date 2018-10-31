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

            var getDashboardLink = function() {
                var url = CONSTANTS.KIBANA + '/app/kibana#/dashboard/dashboard_' +
                    versionId + '?embed=true_g=(refreshInterval:(display:\'5%20seconds\',' +
                    'pause:!f,section:1,value:5000),time:(from:now-1h,mode:quick,to:now))';
                if (url.startsWith('localhost')) {
                    url = 'http://' + url;
                }
                return $sce.trustAsResourceUrl(url);
            };

            $scope.initDashboard = function () {
                $scope.dashboardLink = getDashboardLink();
                document.getElementById('dashboardIframe').contentWindow.location.reload();
            };

        }
    ]);