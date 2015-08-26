'use strict';

angular.module('loginApp', ['ngStorage'])
    .controller('LoginCtrl', ['$scope', '$http', '$window', '$timeout', '$localStorage', 'CONSTANTS',
        function ($scope, $http, $window, $timeout, $localStorage, CONSTANTS) {
            $scope.$storage = $localStorage;

            $scope.login = function () {
                $http.post(CONSTANTS.APIPATH + '/login', $scope.user).success(function (data) {
                    $localStorage.$reset();
                    $scope.$storage.user = data.user;

                    $http.get(CONSTANTS.APIPATH + '/users/' + data.user._id + '/roles').success(function (data) {
                        $scope.$storage.user.roles = data;
                        // Timeout needed in order to ensure that the
                        // $localStorage changes are persisted, more info. at
                        // https://github.com/gsklee/ngStorage/issues/39
                        $timeout(function () {
                            $window.location.href = '/home';
                        }, 110);
                    }).error(function (data, status) {
                        console.error('Error on get /api/users/:userId/roles: ' + JSON.stringify(data) + ', status: ' + status);

                    });
                }).error(function (data, status) {
                    console.error('Error on post /api/login: ' + JSON.stringify(data) + ', status: ' + status);
                });
            };
        }]);