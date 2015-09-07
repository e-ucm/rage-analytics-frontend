'use strict';

angular.module('homeApp', ['ngStorage', 'services'])
    .controller('HomeCtrl', ['$scope', '$http', '$window', '$localStorage', 'Games', 'Versions', 'Role', 'CONSTANTS',
        function ($scope, $http, $window, $localStorage, Games, Versions, Role, CONSTANTS) {
            $scope.$storage = $localStorage;
            $scope.game = {};
            var getGames = function () {
                $http.get(CONSTANTS.PROXY + '/games/my').success(function (data) {
                    $scope.games = data;
                }).error(function (data, status) {
                    console.error('Error on get /games/my ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            getGames();

            $scope.createGame = function () {
                var game = new Games();
                game.title = $scope.game.gameTitle ? $scope.game.gameTitle : 'new game';
                game.$save().then(function (game) {
                    var version = new Versions();
                    version.gameId = game._id;
                    version.$save(function () {
                        $scope.gameTitle = '';
                        $window.location = '/data?game=' + game._id + '&version=' + version._id;
                    });

                });
            };

            $scope.isTeacher = function () {
                return Role.isTeacher();
            };

            $scope.isDeveloper = function () {
                return Role.isDeveloper();
            };
        }
    ]);