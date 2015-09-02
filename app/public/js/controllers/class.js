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
                $http.get(CONSTANTS.PROXY + '/games/' + getQueryParam('game') + '/versions/' + getQueryParam('version') + '/sessions').success(function (data) {
                    $scope.sessions = data;
                }).error(function (data, status) {
                    console.error('Error on get /games/' + getQueryParam('game') + '/versions/' + getQueryParam('version') + '/sessions' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            getSessions();
            $scope.gameId = getQueryParam('game');
            $scope.versionId = getQueryParam('version');

            $scope.createSession = function () {
                var className = $scope.class.name ? $scope.class.name : 'new class';
                $http.post(CONSTANTS.PROXY + '/games/' + getQueryParam('game') + '/versions/' + getQueryParam('version') + '/sessions', {name: className}).success(function (session) {
                    $window.location = '/data'+ '?game=' + getQueryParam('game') + '&version=' + getQueryParam('version') + '&session=' + session._id;
                }).error(function (data, status) {
                    console.error('Error on get /games/' + getQueryParam('game') + '/versions/' + getQueryParam('version') + '/sessions' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.isTeacher = function () {
                return Role.isTeacher();
            };
        }
    ]);