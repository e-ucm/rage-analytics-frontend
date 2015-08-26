'use strict';

angular.module('signupApp', ['ngStorage'])
    .controller('SignupCtrl', ['$scope', '$http', '$window', 'CONSTANTS',
        function ($scope, $http, $window, CONSTANTS) {

            $scope.repeatedPassword = '';

            $scope.signup = function () {
                $http.post(CONSTANTS.APIPATH + '/signup', $scope.user).success(function () {
                    $window.location.href = '/login';
                }).error(function (data, status) {
                    console.error('Error on post /signup: ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.isValidPassword = function () {
                return $scope.user && $scope.repeatedPassword !== '' && $scope.user.password === $scope.repeatedPassword;
            };

            $scope.isEmpty = function (data) {
                return !data || data === '';
            };
        }]);