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

angular.module('signupApp', ['ngStorage'])
    .controller('SignupCtrl', ['$scope', '$http', '$window', 'CONSTANTS',
        function ($scope, $http, $window, CONSTANTS) {
            $scope.repeatedPassword = '';
            $scope.errorResponse = '';

            var showAlert = false;
            $scope.signup = function () {
                showAlert = true;
                if ($scope.isValidPassword() && !$scope.isEmpty($scope.user.username) && !$scope.isEmpty($scope.user.email)) {
                    $scope.user.role = $scope.selectedRole;
                    $scope.user.prefix = CONSTANTS.PREFIX;
                    $http.post(CONSTANTS.APIPATH + '/signup', $scope.user).success(function () {
                        $scope.errorResponse = '';
                        $window.location.href = 'login';
                    }).error(function (data, status) {
                        console.error('Error on post /signup: ' + JSON.stringify(data) + ', status: ' + status);
                        $scope.errorResponse = data.message;
                    });
                }
            };

            $scope.isValidPassword = function () {
                return !showAlert || $scope.user && $scope.repeatedPassword !== '' && $scope.user.password === $scope.repeatedPassword;
            };

            $scope.isEmpty = function (data) {
                return showAlert && (!data || data === '');
            };

            $scope.selectedRole = 'student';
            $scope.selectRole = function (role) {
                $scope.selectedRole = role;
            };
        }]);