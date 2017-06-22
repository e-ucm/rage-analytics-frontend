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

angular.module('loginApp', ['ngStorage', 'ngCookies'])
    .controller('LoginCtrl', ['$scope', '$rootScope', '$http', '$window', '$location', '$timeout', '$localStorage', '$cookies', 'CONSTANTS',
        function ($scope, $rootScope, $http, $window, $location, $timeout, $localStorage, $cookies, CONSTANTS) {
            $scope.$storage = $localStorage;

            $scope.login = function () {
                $http.post(CONSTANTS.APIPATH + '/login', $scope.user).success(function (data) {
                    $localStorage.$reset();
                    $scope.$storage.user = data.user;
                    $cookies.put('rageUserCookie', data.user.token, {path: '/'});

                    $http.get(CONSTANTS.APIPATH + '/users/' + data.user._id + '/roles').success(function (data) {
                        $scope.$storage.user.roles = data;
                        // Timeout needed in order to ensure that the
                        // $localStorage changes are persisted, more info. at
                        // https://github.com/gsklee/ngStorage/issues/39
                        $location.url('home');
                        $rootScope.$broadcast('login');
                        $rootScope.$broadcast('refreshGames');
                        $rootScope.$broadcast('refreshClasses');
                        $rootScope.$broadcast('refreshActivities');
                    }).error(function (data, status) {
                        console.error('Error on get /api/users/:userId/roles: ' + JSON.stringify(data) + ', status: ' + status);
                        $scope.errorResponse = data.message;
                    });
                }).error(function (data, status) {
                    console.error('Error on post /api/login: ' + JSON.stringify(data) + ', status: ' + status);
                    $scope.errorResponse = data.message;
                });
            };

            $scope.loginSaml = function () {
                var location = CONSTANTS.APIPATH + '/login/' + $scope.saml.pluginId + '?callback=' + encodeURIComponent(
                        $window.location.origin + $window.location.pathname + 'byplugin');
                $location.url(location);
            };

            $scope.saml = null;
            $http.get(CONSTANTS.APIPATH + '/loginplugins').success(function (results) {

                for (var i = 0; i < results.data.length; ++i) {
                    if (results.data[i].pluginId === 'samlnl') {
                        $scope.saml = results.data[i];
                        return;
                    }
                }
            });

            $scope.hasSaml = function() {
                return $scope.saml !== null;
            };
        }]);