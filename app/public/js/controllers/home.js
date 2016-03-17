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

angular.module('homeApp', ['ngStorage', 'services'])
    .controller('HomeCtrl', ['$scope', '$http', '$window', '$localStorage', 'Games', 'Versions', 'Role', 'CONSTANTS',
        function ($scope, $http, $window, $localStorage, Games, Versions, Role, CONSTANTS) {
            $scope.$storage = $localStorage;
            $scope.game = {};
            var getGames = function () {
                $http.get(CONSTANTS.PROXY + '/games/my').success(function (data) {
                    $scope.games = data;
                }).error(function (data, status) {
                    console.error('Error on get /games/my ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            getGames();

            $scope.createGame = function () {
                var game = new Games();
                game.title = $scope.game.gameTitle ? $scope.game.gameTitle : 'new game';
                game.$save().then(function (game) {
                    var version = new Versions();
                    version.gameId = game._id;
                    version.$save(function () {
                        $scope.gameTitle = '';
                        $window.location = 'data?game=' + game._id + '&version=' + version._id;
                    });

                });
            };

            $scope.isTeacher = function () {
                return Role.isTeacher();
            };

            $scope.isDeveloper = function () {
                return Role.isDeveloper();
            };
        }
    ]);