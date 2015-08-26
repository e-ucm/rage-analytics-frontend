'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [
    'ngRoute', 'signupApp', 'loginApp', 'homeApp', 'classApp', 'gameApp', 'toolbarApp', 'services', 'xeditable',
]).run(function (editableOptions) {
    editableOptions.theme = 'bs3';
}).filter('prettyDateId', function () {
    return function (_id) {
        return $.format.prettyDate(new Date(parseInt(_id.slice(0, 8), 16) * 1000));
    };
}).filter('prettyDate', function () {
    return function (date) {
        return $.format.prettyDate(new Date(date));
    };
}).filter('list', function () {
    return function (list) {
        if (!list || list.length === 0) {
            return 'Empty list';
        } else {
            var result = '';
            list.forEach(function (v) {
                result += v + ', ';
            });
            return result;
        }
    };
}).filter('object2array', function () {
    return function (input) {
        var out = [];
        for (var i in input) {
            out.push(input[i]);
        }
        return out;
    };
}).factory('httpRequestInterceptor', ['$localStorage',
    function ($localStorage) {
        return {
            request: function (config) {
                if ($localStorage.user) {
                    config.headers.Authorization = 'Bearer ' + $localStorage.user.token;
                }

                return config;
            }
        };
    }
]).constant('CONSTANTS', {
    APIPATH: 'http://localhost:3000/api',
    PREFIX: 'gleaner',
    PROXY: 'http://localhost:3000/api/proxy/gleaner'
}).config(['$routeProvider', '$httpProvider', '$locationProvider',
    function ($routeProvider, $httpProvider, $locationProvider) {
        $httpProvider.interceptors.push('httpRequestInterceptor');
        $locationProvider.html5Mode(true);
        $routeProvider.when('/home', {
            templateUrl: '/home',
            controller: 'HomeCtrl'
        }).when('/class', {
            templateUrl: '/class',
            controller: 'ClassCtrl'
        }).when('/game', {
            templateUrl: '/game',
            controller: 'GameCtrl'
        }).when('/login', {
            templateUrl: '/login',
            controller: 'LoginCtrl'
        }).when('/signup', {
            templateUrl: '/signup',
            controller: 'SignupCtrl'
        }).otherwise({
            redirectTo: '/login'
        });
    }
]).controller('AppCtrl', ['$scope', '$location', '$http', '$localStorage', '$window', 'Games', 'Versions', 'CONSTANTS',
    function ($scope, $location, $http, $localStorage, $window, Games, Versions, CONSTANTS) {
        $scope.$storage = $localStorage;
        $scope.loading = 0;
        $scope.load = function () {
            $scope.loading++;
        };

        $scope.loaded = function () {
            $scope.loading--;
        };

        $scope.load();
        $scope.games = Games.query(function () {
            var gameId = $location.search().game;
            if (gameId) {
                for (var i = 0; i < $scope.games.length; i++) {
                    if ($scope.games[i]._id === gameId) {
                        $scope.selectedGame = $scope.games[i];
                    }
                }
            }

            if (!$scope.selectedGame) {
                $scope.selectedGame = $scope.games[0];
            }
            $scope.refreshVersions();
            $scope.loaded();
        });

        $scope.saveGame = function () {
            if ($scope.selectedGame) {
                $scope.load();
                $http.post(CONSTANTS.PROXY + '/games/' + $scope.selectedGame._id, {title: $scope.selectedGame.title}).success(function () {
                    $scope.loaded();
                }).error(function (data, status) {
                    console.error('Error on post /api/games/' + $scope.selectedGame._id + " " + JSON.stringify(data) + ', status: ' + status);
                });
            }
        };


        $scope.saveVersion = function (callback) {
            if ($scope.selectedVersion) {
                $scope.selectedVersion.$save(callback);
            }
        };

        $scope.refreshVersions = function (callback) {
            if ($scope.selectedGame) {
                $scope.form.selectedGame = $scope.selectedGame;
                $scope.load();
                $scope.versions = Versions.query({
                    gameId: $scope.selectedGame._id
                }, function () {
                    $scope.selectedVersion = null;
                    var versionId = $location.search().version;
                    if (versionId) {
                        for (var i = 0; i < $scope.versions.length; i++) {
                            if ($scope.versions[i]._id === versionId) {
                                $scope.selectedVersion = $scope.versions[i];
                            }
                        }
                    }

                    if (!$scope.selectedVersion) {
                        $scope.selectedVersion = $scope.versions[0];
                    }

                    $scope.form.selectedVersion = $scope.selectedVersion;

                    if (callback) {
                        callback();
                    }
                    $scope.loaded();
                });
            }
        };

        $scope.form = {
            selectedGame: null,
            selectedVersion: null,
            selectedSession: null
        };

        $scope.setSelectGameAndGo = function (url, game) {
            $scope.setSelectedGame(game);
            $window.location = url + '?game=' + $scope.form.selectedGame._id + '&version=' + $scope.form.selectedVersion._id;
        };

        $scope.setSelectedGame = function (game) {
            $scope.form.selectedGame = game;
            if (!$scope.form.selectedVersion) {
                $scope.form.selectedVersion = $scope.versions[0];
            }
        };

        $scope.setSelectedVersion = function (version) {
            $scope.form.selectedVersion = version;
        };

        $scope.setSelectedSession = function (session) {
            $scope.form.selectedSession = session;
        };

        $scope.$watch('form.selectedGame', function (selected) {
            if (selected) {
                $scope.selectedGame = selected;
                $location.search('game', selected._id);
                $scope.refreshVersions();
            }
        });

        $scope.$watch('form.selectedVersion', function (selected) {
            if (selected) {
                $location.search('version', selected._id);
                $scope.selectedVersion = selected;
            }
        });

        $scope.$watch('form.selectedSession', function (selected) {
            if (selected) {
                $location.search('session', selected._id);
                $scope.selectedSession = selected;
            }
        });
    }
]);