'use strict';

angular.module('gameApp', ['ngStorage', 'services', 'myApp'])
    .controller('GameCtrl', ['$scope', '$http', '$window', '$localStorage', 'Games', 'Role',
        function ($scope, $http, $window, $localStorage, Games, Role) {
            $scope.$storage = $localStorage;

            $scope.isTeacher = function () {
                return Role.isTeacher();
            };

            $scope.deleteGame = function () {
                if ($scope.selectedGame) {
                    $scope.selectedGame.$remove(function () {
                        $window.location = '/home';
                    });
                }
            };
        }
    ]);


