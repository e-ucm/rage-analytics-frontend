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

angular.module('toolbarApp', ['ngStorage', 'services', 'myApp'])
    .controller('ToolbarCtrl', ['$scope', '$rootScope', '$location', '$http', 'Classes', 'Games', 'Activities', 'Role',
        function ($scope, $rootScope, $location, $http, Classes, Games, Activities, Role) {
            $scope.activity = {};
            $scope.class = {};

            $scope.hasActivities = function () {
                return ($scope.activities ? $scope.activities.length : 0) !== 0;
            };

            $scope.hasClasses = function () {
                return ($scope.classes ? $scope.classes.length : 0) !== 0;
            };

            $scope.hasGames = function () {
                return ($scope.games ? $scope.games.length : 0) !== 0;
            };

            if (Role.isUser()) {
                if (Role.isDeveloper()) {
                    $scope.games = Games.my();
                } else {
                    $scope.games = Games.public();
                    $scope.classes = Classes.my();
                    $scope.activities = Activities.my();
                }
            }

            $scope.$on('login', function () {
                $scope.games = Role.isDeveloper() ? Games.my() : Games.public();
            });

            $scope.$on('logout', function () {
                $scope.games = Role.isDeveloper() ? Games.my() : Games.public();
            });

            $scope.$on('refreshClasses', function () {
                if (Role.isUser()) {
                    $scope.classes = Classes.my(function () {
                        $scope.activities = Activities.my();
                    });
                } else {
                    $scope.games = undefined;
                    $scope.classes = undefined;
                    $scope.activities = undefined;
                }
            });

            $scope.$on('refreshGames', function () {
                if (Role.isUser()) {
                    $scope.games = Role.isDeveloper() ? Games.my() : Games.public();
                } else {
                    $scope.games = undefined;
                    $scope.classes = undefined;
                    $scope.activities = undefined;
                }
            });

            $scope.$on('refreshActivities', function () {
                if (Role.isUser()) {
                    $scope.activities = Activities.my();
                } else {
                    $scope.activities = undefined;
                    $scope.classes = undefined;
                    $scope.activities = undefined;
                }
            });
        }
    ]);