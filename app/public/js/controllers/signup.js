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
                    $http.post(CONSTANTS.APIPATH + '/signup', $scope.user).success(function () {
                        $scope.errorResponse = '';
                        $window.location.href = '/login';
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
        }]);