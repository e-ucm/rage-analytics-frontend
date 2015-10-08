'use strict';

angular.module('classApp', ['ngStorage', 'services'])
    .controller('ClassCtrl', ['$scope', '$location', '$http', '$window', '$localStorage', 'Games', 'Versions', 'Sessions', 'Role', 'CONSTANTS', 'QueryParams',
        function ($scope, $location, $http, $window, $localStorage, Games, Versions, Sessions, Role, CONSTANTS, QueryParams) {
            $scope.$storage = $localStorage;
            $scope.session = {};
            $scope.class = {};

            var getSessions = function () {
                $http.get(CONSTANTS.PROXY + '/games/' + QueryParams.getQueryParam('game') + '/versions/' +
                    QueryParams.getQueryParam('version') + '/sessions/my').success(function (data) {
                    $scope.sessions = data;
                }).error(function (data, status) {
                    console.error('Error on get /games/' + QueryParams.getQueryParam('game') + '/versions/' +
                        QueryParams.getQueryParam('version') + '/sessions/my' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            getSessions();
            $scope.gameId = QueryParams.getQueryParam('game');
            $scope.versionId = QueryParams.getQueryParam('version');
            $scope.loading = false;

            $scope.createSession = function () {
                var className = $scope.class.name ? $scope.class.name : 'New class';
                $http.post(CONSTANTS.PROXY + '/games/' + QueryParams.getQueryParam('game') + '/versions/' +
                    QueryParams.getQueryParam('version') + '/sessions', {name: className}).success(function (session) {
                    $window.location = '/data' + '?game=' + QueryParams.getQueryParam('game') + '&version=' +
                        QueryParams.getQueryParam('version') + '&session=' + session._id;
                }).error(function (data, status) {
                    console.error('Error on get /games/' + QueryParams.getQueryParam('game') + '/versions/' +
                        QueryParams.getQueryParam('version') + '/sessions' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.isTeacher = function () {
                return Role.isTeacher();
            };

            $scope.startSession = function (session) {
                $scope.loading = true;
                $http.post(CONSTANTS.PROXY + '/sessions/' + session._id + '/event/start').success(function (s) {
                    $scope.loading = false;
                    $scope.selectedSession = s;
                    getSessions();
                }).error(function (data, status) {
                    console.error('Error on get /games/' + '/sessions/' + session._id + '/event/start ' +
                        JSON.stringify(data) + ', status: ' + status);
                    $scope.loading = false;
                });
            };

            $scope.endSession = function (session) {
                $scope.loading = true;
                $http.post(CONSTANTS.PROXY + '/sessions/' + session._id + '/event/end').success(function (s) {
                    $scope.loading = false;
                    $scope.selectedSession = s;
                    getSessions();
                }).error(function (data, status) {
                    console.error('Error on get /games/' + '/sessions/' + session._id + '/event/end ' +
                        JSON.stringify(data) + ', status: ' + status);
                    $scope.loading = false;
                });
            };

            $scope.sessionState = function (session) {
                return session && session.start && !session.end;
            };

        }
    ]);