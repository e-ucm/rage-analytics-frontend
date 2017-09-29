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

angular.module('gameApp', ['ngStorage', 'services', 'ngFileUpload'])
    .controller('GameCtrl', ['$scope', '$attrs', '$http', '$window', '$sce', '$timeout', 'Games', 'Versions', 'Analysis', 'Role', 'CONSTANTS',
        function ($scope, $attrs, $http, $window, $sce, $timeout, Games, Versions, Analysis, Role, CONSTANTS) {

            var gameId, versionId;
            var load = function(gameId, versionId) {
                var afterLoad = function() {
                    if ($scope.game && $scope.version) {
                        console.log('loaded');
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
            $scope.developer = {};

            $scope.changeTitle = function () {
                $http.put(CONSTANTS.PROXY + '/games/' + $scope.game._id, {title: $scope.game.title}).success(function (data) {
                }).error(function (data, status) {
                    console.error('Error on put /games/' + $scope.game._id + ' ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.public = 'btn-default';

            $scope.publicGame = function () {
                $scope.game.$update();
            };

            $scope.changeGameLink = function () {
                $http.put(CONSTANTS.PROXY + '/games/' + $scope.game._id, {link: $scope.game.link}).success(function (data) {
                }).error(function (data, status) {
                    console.error('Error on post /games/' + $scope.game._id + ' ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.deleteGame = function (redirect) {
                if ($scope.game) {
                    $scope.game.$remove(function () {
                        if (redirect) {
                            $window.location = '/home';
                        }
                    });
                }
            };

            $scope.saveVersion = function() {
                if ($scope.version) {
                    $scope.version.$update();
                }
            };

            // Developers

            $scope.inviteDeveloper = function () {
                if ($scope.developer.name) {
                    $http.put(CONSTANTS.PROXY + '/games/' + $scope.game._id, {developers: $scope.developer.name}).success(function (data) {
                        $scope.game.developers = data.developers;
                    }).error(function (data, status) {
                        console.error('Error on post /games/' + $scope.game._id + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };

            $scope.ejectDeveloper = function (developer) {
                $http.put(CONSTANTS.PROXY + '/games/' + $scope.game._id + '/remove', {developers: developer}).success(function (data) {
                    $scope.game.developers = data.developers;
                }).error(function (data, status) {
                    console.error('Error on post /games/' + $scope.game._id + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.isRemovable = function (dev) {
                var developers = $scope.game.developers;
                if (developers && developers.length === 1) {
                    return false;
                }
                if ($scope.username === dev) {
                    return false;
                }
                return $scope.isAuthor();
            };

            $scope.isAuthor = function () {
                if (!$scope.game) {
                    return false;
                }
                var authors = $scope.game.authors;
                if (!authors) {
                    return false;
                }
                if (authors.indexOf($scope.username) === -1) {
                    return false;
                }
                return true;
            };

            // Alerts and warnings
            $scope.addWarning = function () {
                $scope.addToList('warnings', {
                    cond: 'false',
                    message: 'No message'
                });
            };

            $scope.addAlert = function () {
                $scope.addToList('alerts', {
                    expression: '0',
                    maxDiff: 0,
                    message: 'No message'
                });
            };

            $scope.addToList = function (list, object) {
                if ($scope.version) {
                    if (!$scope.version[list]) {
                        $scope.version[list] = [];
                    }
                    $scope.version[list].push(object);
                    $scope.version.$save();
                }
            };

            $scope.deleteFromList = function (list, object) {
                var index = $scope.version[list].indexOf(object);
                if (index > -1) {
                    $scope.version[list].splice(index, 1);
                }
                $scope.version.$save();
            };

            $scope.showLrs = undefined;
            if($scope.showLrs === undefined){
                $http.get(CONSTANTS.PROXY + '/env').success(function (data) {
                    $scope.showLrs = data.useLrs;
                });
            }
        }
    ]);


