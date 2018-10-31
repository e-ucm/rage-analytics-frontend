/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [
    'ngRoute', 'toolbarApp', 'signupApp', 'loginApp', 'loginPluginApp', 'classApp', 'participantsApp', 'classesApp', 'activitiesApp',
    'activityApp', 'gameApp', 'analysisApp', 'kibanaApp', 'gamesApp', 'activityApp', 'analyticsApp', 'devVisualizatorApp',
    'services', 'xeditable', 'env-vars', 'ui.router', 'blockUI'
]).run(function (editableOptions, $localStorage, $cookies) {
    editableOptions.theme = 'bs3';
    if ($localStorage.user) {
        $cookies.put('rageUserCookie', $localStorage.user.token, {
            path: '/'
        });
    }
}).filter('prettyDateId', function () {
    return function (_id) {
        if (_id) {
            return $.format.prettyDate(new Date(parseInt(_id.slice(0, 8), 16) * 1000));
        }
    };
}).filter('prettyDate', function () {
    return function (date) {
        if (date) {
            return $.format.prettyDate(new Date(date));
        }
    };
}).filter('list', function () {
    return function (list) {
        if (!list || list.length === 0) {
            return 'Empty list';
        }

        var result = '';
        list.forEach(function (v) {
            result += v + ', ';
        });
        return result;
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
                config.headers.Accept = 'application/json';
                if ($localStorage.user) {
                    config.headers.Authorization = 'Bearer ' + $localStorage.user.token;
                }
                return config;
            }
        };
    }
]).config(['$routeProvider', '$httpProvider', '$locationProvider', '$stateProvider', 'blockUIConfig',
    function ($routeProvider, $httpProvider, $locationProvider, $stateProvider, blockUIConfig) {
        $httpProvider.interceptors.push('httpRequestInterceptor');
        $locationProvider.html5Mode({enabled: true, requireBase: false});

        $stateProvider.state({
            name: 'default',
            url: '/',
            templateUrl: 'view/home'
        });

        $stateProvider.state({
            name: 'home',
            url: '/home',
            templateUrl: 'view/home'
        });
        $stateProvider.state({
            name: 'login',
            url: '/login',
            templateUrl: 'view/login'
        });
        $stateProvider.state({
            name: 'signup',
            url: '/signup',
            templateUrl: 'view/signup'
        });
        $stateProvider.state({
            name: 'class',
            url: '/class',
            templateUrl: 'view/classactivity'
        });
        $stateProvider.state({
            name: 'data',
            url: '/data',
            templateUrl: 'view/data'
        });
        $stateProvider.state({
            name: 'game',
            url: '/game',
            templateUrl: 'view/gameactivity'
        });

        blockUIConfig.autoBlock = false;
        blockUIConfig.message = 'Please wait...';
    }
]).controller('AppCtrl', ['$rootScope', '$scope', '$location', '$http', '$timeout', '$localStorage', '$window',
    'Games', 'Classes', 'Activities', 'Versions', 'Analysis', 'Role', 'CONSTANTS', 'QueryParams',
    function ($rootScope, $scope, $location, $http, $timeout, $localStorage,
              $window, Games, Classes, Activities, Versions, Analysis, Role, CONSTANTS, QueryParams) {
        $scope.$storage = $localStorage;
        $scope.DOCS = CONSTANTS.DOCS;

        // Role determination
        $scope.isUser = function () {
            return Role.isUser();
        };

        $scope.isAdmin = function () {
            return Role.isAdmin();
        };

        $scope.isStudent = function () {
            return Role.isStudent();
        };

        $scope.isTeacher = function () {
            return Role.isTeacher();
        };

        $scope.isOfflineActivity = function () {
            return $scope.isOfflineActivityParam($scope.selectedActivity);
        };

        $scope.isOnlineActivity = function () {
            return $scope.isOnlineActivityParam($scope.selectedActivity);
        };

        $scope.isOfflineActivityParam = function (activity) {
            return activity && activity.offline;
        };

        $scope.isOnlineActivityParam = function (activity) {
            return activity && !activity.offline;
        };

        $scope.isDeveloper = function () {
            return Role.isDeveloper();
        };

        $scope.goToClass = function(c) {
            $scope.$emit('selectClass', { class: c});
        };

        $scope.goToGame = function(game) {
            $scope.$emit('selectGame', { game: game});
        };

        $scope.goToActivity = function(activity) {
            $scope.$emit('selectActivity', { activity: activity});
        };

        var checkLogin = function() {
            $scope.username = $scope.isUser() ? $scope.$storage.user.username : '';
        };
        checkLogin();
        $scope.$on('login', checkLogin);

        $scope.href = function (href) {
            $window.location.href = href;
        };

        $scope.logout = function () {
            $http.delete(CONSTANTS.APIPATH + '/logout').success(function () {
                delete $scope.$storage.user;
                $timeout(function () {
                    $location.url('login');
                }, 50);
            }).error(function (data, status) {
                delete $scope.$storage.user;
                console.error('Error on get /logout ' + JSON.stringify(data) + ', status: ' + status);
            });
        };

        $scope.testIndex = 'default';
        $scope.statementSubmitted = false;
        $scope.submitStatementsFile = function () {
            $scope.loadingDashboard = true;
            $scope.statementsFile.contents = JSON.parse($scope.statementsFile.contents);
            if ($scope.statementsFile.contents) {
                $http.post(CONSTANTS.PROXY + '/activities/test/' + $scope.selectedGame._id, $scope.statementsFile.contents)
                    .success(function (data) {
                        $scope.testIndex = data.id;
                        $scope.statementSubmitted = true;
                        $scope.generateTestVisualization();
                        $scope.loadingDashboard = false;
                    }).error(function (data, status) {
                        $scope.statementSubmitted = true;
                        $scope.generateTestVisualization();
                        console.error('Error on post /activities/test/' + $scope.selectedGame._id + ' ' + JSON.stringify(data) + ', status: ' + status);
                        $scope.loadingDashboard = false;
                    });
            }

        };

        if (!$scope.selectedConfigView) {
            $scope.selectedConfigView = 'stormAnalysis';
        }

        $scope.getActiveClass = function (id) {
            if (id === $scope.selectedConfigView) {
                return 'active';
            }

            return null;
        };

        $scope.templateButtonMsg = function (opened) {
            if (opened) {
                return 'Hide default JSON';
            }

            return 'Show JSON';
        };

        $scope.$on('selectGame', function (event, params) {
            if (params.game) {
                $scope.selectedGame = params.game;
                Versions.forGame({gameId: params.game._id}).$promise.then(function(versions) {
                    $scope.selectedVersion = versions[0];

                    if (Role.isDeveloper()) {
                        $location.url('data');
                    } else {
                        $location.url('game');
                    }

                    $location.search('game', params.game._id);
                    $location.search('version', $scope.selectedVersion._id);
                });
            }
        });

        $scope.$on('selectClass', function (event, params) {
            if (params.class) {
                $scope.selectedClass = params.class;
                $location.url('class');
                $location.search('class', params.class._id);
            }
        });

        $scope.$on('selectActivity', function (event, params) {
            if (params.activity) {
                $scope.selectedActivity = params.activity;
                $scope.selectedClass = Classes.get({classId: params.activity.classId});
                $scope.selectedVersion = Versions.get({gameId: gameId, versionId: params.activity.versionId});
                $scope.selectedGame = Games.get({gameId: params.activity.gameId});
                $location.url('data');
                $location.search('activity', params.activity._id);
            }
        });

        $scope.developer = {
            name: ''
        };

        // Load
        if ($scope.isUser()) {
            var gameId = QueryParams.getQueryParam('game');
            if (gameId) {
                $scope.selectedGame = Games.get({gameId: gameId});
            }
            var versionId = QueryParams.getQueryParam('version');
            if (gameId && versionId) {
                $scope.selectedVersion = Versions.get({gameId: gameId, versionId: versionId});
            }
            var classId = QueryParams.getQueryParam('class');
            if (classId) {
                $scope.selectedClass = Classes.get({classId: classId});
            }
            var activityId = QueryParams.getQueryParam('activity');
            if (activityId) {
                Activities.get({activityId: activityId}).$promise.then(function(activity) {
                    $scope.selectedActivity = activity;
                    $scope.selectedClass = Classes.get({classId: activity.classId});
                    $scope.selectedVersion = Versions.get({gameId: gameId, versionId: activity.versionId});
                    $scope.selectedGame = Games.get({gameId: activity.gameId});
                });
            }
        } else if (!$window.location.pathname.endsWith('loginbyplugin')) {
            $location.url('login');
        }
    }
]);