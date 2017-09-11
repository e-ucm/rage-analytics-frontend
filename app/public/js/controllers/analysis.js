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

angular.module('analysisApp', ['ngStorage', 'services'])
    .controller('AnalysisCtrl', ['$scope', '$attrs', '$http', 'Games', 'Versions', 'Analysis', 'Role', 'CONSTANTS',
        function ($scope, $attrs, $http, Games, Versions, Analysis, Role, CONSTANTS) {

            var gameId, versionId;
            var load = function(gameId, versionId) {
                var afterLoad = function() {
                    if ($scope.game && $scope.version) {
                        updateAnalysis();
                    }
                };
                Games.get({gameId: gameId}).$promise.then(function(game) {
                    $scope.game = game;
                    afterLoad();
                });
                Versions.get({gameId: gameId, versionId: versionId}).$promise.then(function(version) {
                    $scope.version = version;
                    afterLoad();
                });
            };

            $attrs.$observe('gameid', function() {
                gameId = $attrs.gameid;
                if (gameId && versionId) {
                    load(gameId, versionId);
                }
            });

            $attrs.$observe('versionid', function() {
                versionId = $attrs.versionid;
                if (gameId && versionId) {
                    load(gameId, versionId);
                }
            });

            $scope.init = function(game, version) {

            };

            $scope.analysisFile = undefined;
            // Analysis file management
            $scope.submit = function () {
                if ($scope.analysisFile) {
                    if ($scope.analysis && $scope.version._id === $scope.analysis._id) {
                        $scope.deleteAnalysis();
                    } else {
                        $scope.upload($scope.analysisFile);
                    }
                }
            };

            $scope.deleteAnalysis = function () {
                Analysis.delete({versionId: $scope.version._id}, function () {
                    $scope.analysis = undefined;
                    $scope.upload($scope.file);
                });
            };

            // Upload on file select or drop
            $scope.upload = function (file) {
                var formData = new FormData();
                $scope.loadingAnalysis = true;
                formData.append('analysis', file);
                $http.post(CONSTANTS.PROXY + '/analysis/' + $scope.version._id, formData, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined,
                        enctype: 'multipart/form-data'
                    }
                }).then(function successCallback(response) {
                    // This callback will be called asynchronously
                    // when the response is available

                    // Check if the version has an analysis uploaded
                    updateAnalysis();
                    $scope.loadingAnalysis = false;
                }, function errorCallback(response) {
                    // Called asynchronously if an error occurs
                    // or server returns response with an error status.
                    console.error('Error on post /analysis/' + $scope.version._id + ' ' +
                        JSON.stringify(response, null, '  '));

                    // Check if the version has an analysis uploaded
                    updateAnalysis();
                    $scope.loadingAnalysis = false;
                });
            };

            var updateAnalysis = function () {
                if ($scope.version && Role.isDeveloper()) {
                    $scope.analysis = Analysis.get({versionId: $scope.version._id});
                }
            };
        }
    ]);


