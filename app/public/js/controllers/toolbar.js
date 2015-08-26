'use strict';

angular.module('toolbarApp', ['ngStorage'])
    .controller('ToolbarCtrl', ['$scope', '$http', '$window', '$timeout', '$localStorage', 'CONSTANTS',
        function ($scope, $http, $window, $timeout, $localStorage, CONSTANTS) {
            $scope.$storage = $localStorage;

            $scope.isAdmin = function () {
                return $scope.isUser() &&
                    $scope.$storage.user.roles && $scope.$storage.user.roles.indexOf('admin') !== -1;
            };

            $scope.isUser = function () {
                return $scope.$storage && $scope.$storage.user;
            };

            $scope.href = function (href) {
                $window.location.href = href;
            };

            $scope.logout = function () {
                $http.delete(CONSTANTS.APIPATH + '/logout').success(function () {
                    delete $scope.$storage.user;
                    $timeout(function () {
                        $scope.href('/login');
                    }, 110);
                }).error(function (data, status) {
                    console.error('Error on get /logout ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

        }]);