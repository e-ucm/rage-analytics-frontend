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

angular.module('loginPluginApp', ['ngStorage', 'ngCookies'])
    .controller('LoginPluginCtrl', ['$scope', '$http', '$window', '$timeout', '$localStorage', 'CONSTANTS',
        function ($scope, $http, $window, $timeout, $localStorage, CONSTANTS) {
            $scope.$storage = $localStorage;
            $scope.setupUser = function (user) {
                if (user && user.username && user.email && user.token) {
                    $scope.$storage.user = user;
                    if (user.redirect) {
                        $http.get(CONSTANTS.PROXY + '/lti/key/' + user.redirect).success(function(data) {
                            var baseUrl = 'home';
                            var params = '?';
                            params += data.classId ? '&class=' + data.classId : '';
                            if (data.classId) {
                                baseUrl = 'classactivity';
                            } else if (data.gameId) {
                                baseUrl = 'class';
                            }
                            $timeout(function () {
                                $window.location.href = baseUrl + params;
                            }, 110);
                        });
                    } else {
                        $timeout(function () {
                            $window.location.href = 'home';
                        }, 110);
                    }
                } else {
                    $window.location.href = 'login';
                }
            };
        }]);