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

angular.module('dataApp', ['myApp', 'ngStorage', 'services'])
    .controller('DataCtrl', ['$scope',
        function ($scope) {

            $scope.addWarning = function () {
                $scope.addToList('warnings', {
                    query: '{}',
                    message: 'No message.'
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
                if ($scope.selectedVersion) {
                    if (!$scope.selectedVersion[list]) {
                        $scope.selectedVersion[list] = [];
                    }
                    $scope.selectedVersion[list].push(object);
                    $scope.selectedVersion.$save();
                }
            };

            $scope.deleteFromList = function (list, object) {
                var index = $scope.selectedVersion[list].indexOf(object);
                if (index > -1) {
                    $scope.selectedVersion[list].splice(index, 1);
                }
                $scope.selectedVersion.$save();
            };
        }
    ]);