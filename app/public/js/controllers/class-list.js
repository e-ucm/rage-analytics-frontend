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

angular.module('classesApp', ['ngStorage', 'services'])
    .controller('ClassesCtrl', ['$scope', '$rootScope', '$location', '$http', 'Classes', '$timeout',
        function ($scope, $rootScope, $location, $http, Classes, $timeout) {
            $scope.activity = {};
            $scope.class = {};

            $scope.goToClass = function(c) {
                $rootScope.$broadcast('selectClass', { class: c});
            };

            var getClasses = function () {
                $scope.classes = Classes.my();
            };

            getClasses();
            $scope.loading = false;

            $scope.createClass = function () {
                var c = new Classes();
                c.name = $scope.class.name ? $scope.class.name : 'New class';
                c.$save().then(function() {
                    $rootScope.$broadcast('refreshClasses');
                    $scope.goToClass(c);
                });
            };

            $scope.deleteClass = function (classObj) {
                classObj.$remove().then(function() {
                    $timeout(function() {
                        $rootScope.$broadcast('refreshClasses');
                    }, 20);
                });
            };

            $scope.$on('refreshClasses', function () {
                Classes.my().$promise.then(function(classes) { $scope.classes = classes; });
            });
        }
    ]);