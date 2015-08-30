'use strict';

angular.module('classApp', ['ngStorage', 'services'])
    .controller('ClassCtrl', ['$scope', '$location', '$http', '$window', '$localStorage', 'Games', 'Versions', 'Sessions', 'Role', 'CONSTANTS',
        function ($scope, $location, $http, $window, $localStorage, Games, Versions, Sessions, Role, CONSTANTS) {
            $scope.$storage = $localStorage;
            $scope.session = {};
            $scope.class = {};


            function getQueryParam(param) {
                var result = window.location.search.match(
                    new RegExp("(\\?|&)" + param + "(\\[\\])?=([^&]*)")
                );

                return result ? result[3] : false;
            }

            var getSessions = function () {
                $http.get(CONSTANTS.PROXY + '/sessions/' + getQueryParam('game') + '/' + getQueryParam('version')).success(function (data) {
                    $scope.sessions = data;
                }).error(function (data, status) {
                    console.error('Error on get /sessions/:gameId/:versionId ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            getSessions();
            $scope.gameId = getQueryParam('game');
            $scope.versionId = getQueryParam('version');

            $scope.createSession = function () {
                $http.post(CONSTANTS.PROXY + '/sessions/' + getQueryParam('game') + '/' + getQueryParam('version') + '/start', {name: $scope.class.name}).success(function (data) {
                    $window.location = '/data';
                }).error(function (data, status) {
                    console.error('Error on get /sessions/:gameId/:versionId ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.isTeacher = function () {
                return Role.isTeacher();
            };
        }
    ]);