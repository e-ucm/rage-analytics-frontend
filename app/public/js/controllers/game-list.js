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

angular.module('gamesApp', ['ngStorage', 'services', 'myApp'])
    .controller('GameListCtrl', ['$scope', '$rootScope', '$http', '$window', 'Games', 'Versions', 'Role', 'blockUI', 'CONSTANTS',
        function ($scope, $rootScope, $http, $window, Games, Versions, Role, blockUI, CONSTANTS) {

            $scope.game = {};

            $scope.goToGame = function(game) {
                $rootScope.$broadcast('selectGame', { game: game });
            };

            // Initialization load
            var getGames = function () {
                if (Role.isDeveloper()) {
                    $scope.games = Games.my();
                } else {
                    $scope.games = Games.public();
                }
            };

            getGames();

            $scope.createGame = function () {
                var game = new Games();
                game.title = $scope.game.gameTitle ? $scope.game.gameTitle : 'new game';
                blockUI.start();
                game.$save().then(function (game) {
                    $rootScope.$broadcast('refreshGames');
                    $scope.goToGame(game);
                    blockUI.stop();
                });
            };

            $scope.deleteGame = function (game) {
                game.$remove();
                $rootScope.$broadcast('refreshGames');
            };

            $scope.$on('refreshGames', function() {getGames();});
        }
    ]);


