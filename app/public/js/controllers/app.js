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
    'ngRoute', 'signupApp', 'loginApp', 'loginPluginApp', 'homeApp', 'classApp', 'activitiesApp', 'gameApp',
    'dataApp', 'activityApp', 'analyticsApp', 'devVisualizatorApp', 'services', 'xeditable',
    'env-vars', 'ngFileUpload'
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
                if ($localStorage.user) {
                    config.headers.Authorization = 'Bearer ' + $localStorage.user.token;
                }
                return config;
            }
        };
    }
]).config(['$routeProvider', '$httpProvider', '$locationProvider', '$stateProvider',
    function ($routeProvider, $httpProvider, $locationProvider, $stateProvider) {
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
    }
]).controller('AppCtrl', ['$scope', '$location', '$http', '$timeout', '$localStorage', '$window',
    'Games', 'Classes', 'Activities', 'Versions', 'Analysis', 'Role', 'CONSTANTS', 'QueryParams',
    function ($scope, $location, $http, $timeout, $localStorage,
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

        $scope.isDeveloper = function () {
            return Role.isDeveloper();
        };

        $scope.username = $scope.isUser() ? $scope.$storage.user.username : '';

        $scope.href = function (href) {
            $window.location.href = href;
        };

        $scope.logout = function () {
            $http.delete(CONSTANTS.APIPATH + '/logout').success(function () {
                delete $scope.$storage.user;
                $timeout(function () {
                    $scope.href('login');
                }, 110);
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
        }
        ;
        };

        $scope.deleteGame = function (game) {
            if (game) {
                $http.delete(CONSTANTS.PROXY + '/games/' + game._id).success(function () {
                    $scope.games = $http.get(CONSTANTS.PROXY + '/games' + route).success(function (data) {
                        $scope.games = data;
                    }).error(function (data, status) {
                        console.error('Error on get /games/my ' + JSON.stringify(data) + ', status: ' + status);
                    });
                }).error(function (data, status) {
                    console.error('Error on delete /games/' + game._id + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
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
                $scope.versions = Versions.query({
                    gameId: $scope.selectedGame._id
                }, function () {
                    var versionId = $location.search().version;
                    if (versionId) {
                        for (var i = 0; i < $scope.versions.length; i++) {
                            if ($scope.versions[i]._id === versionId) {
                                $scope.selectedVersion = $scope.versions[i];
                            }
                        }
                    } else {
                        $scope.selectedVersion = null;
                    }

                    if (!$scope.selectedVersion && $scope.versions.length > 0) {
                        $scope.selectedVersion = $scope.versions[0];
                    }

                    $scope.form.selectedVersion = $scope.selectedVersion;

                    refreshClasses();

                    // Check if the version has an analysis uploaded
                    updateAnalysis();


                    $scope.getTempleateVisualizations();

                    if (callback) {
                        callback();
                    }
                });
            }
        };

        var refreshClasses = function () {
            var classId = $location.search().class;
            if (classId) {

                $http.get(CONSTANTS.PROXY + '/classes/' + classId).success(function (data) {
                    $scope.selectedClass = data;
                    $scope.refreshActivities();
                }).error(function (data, status) {
                    console.error('Error on get /classes/' + classId);
                });
            }
        };



        $scope.refreshActivities = function () {
            if ($scope.selectedGame && $scope.selectedVersion && $scope.selectedClass) {
                $http.get(CONSTANTS.PROXY + '/activities/my').success(function (data) {
                    $scope.activities = data;

                    var activityId = $location.search().activity;
                    if (activityId) {
                        for (var i = 0; i < $scope.activities.length; i++) {
                            if ($scope.activities[i]._id === activityId) {
                                $scope.selectedActivity = $scope.activities[i];
                                checkAnonymous();
                            }
                        }
                    } else {
                        $scope.selectedActivity = null;
                    }
                }).error(function (data, status) {
                    console.error('Error on get /activities/my' + JSON.stringify(data) + ', status: ' + status);
                });
            }
        };

        $scope.hasActivities = function () {
            return ($scope.activities ? $scope.activities.length : 0) !== 0;
        };


        $scope.hasClasses = function () {
            return ($scope.classes ? $scope.classes.length : 0) !== 0;
        };

        $scope.hasGames = function () {
            return ($scope.games ? $scope.games.length : 0) !== 0;
        };

        $scope.form = {
            selectedGame: null,
            selectedVersion: null,
            selectedActivity: null,
            selectedClass: null
        };

        $scope.deselectedGameAndGo = function (href) {
            $scope.form.selectedGame = null;
            $scope.form.selectedVersion = null;
            $scope.form.selectedActivity = null;
            $scope.form.selectedClass = null;
            $window.location = href;
        };

        $scope.setSelectedGame = function (game) {
            $scope.form.selectedGame = game;
            if (!game) {
                $scope.form.selectedVersion = null;
                $scope.form.selectedClass = null;
                $scope.form.selectedActivity = null;
            }
        };

        $scope.setSelectedVersionAndGo = function (version) {
            $scope.form.selectedVersion = version;
        };

        $scope.setSelectedClass = function (classRes, url) {
            if (!classRes) {
                return;
            }
            $scope.form.selectedClass = classRes;
            // A if ($scope.form.selectedGame && $scope.form.selectedVersion) {
            $window.location = url + '?class=' + classRes._id;
            // }
        };
        /*
        Var getGameId = function () {
            var gameId = null;
            if ($scope.selectedGame) {
                gameId = $scope.selectedGame._id;
            } else if ($scope.form.selectedGame) {
                gameId = $scope.form.selectedGame._id;
            }
            return gameId;
        };

        var getVersionId = function () {
            var versionId = null;
            if ($scope.selectedVersion) {
                versionId = $scope.selectedVersion._id;
            } else if ($scope.form.selectedVersion) {
                versionId = $scope.form.selectedVersion._id;
            }
            return versionId;
        };
        */
        var getClassId = function () {
            var classId = null;
            if ($scope.selectedClass) {
                classId = $scope.selectedClass._id;
            } else if ($scope.form.selectedClass) {
                classId = $scope.form.selectedClass._id;
            }
            return classId;
        };

        $scope.setSelectedActivity = function (activity, url) {
            if (!activity) {
                return;
            }

            var activityId = activity._id;

            $scope.form.selectedActivity = activity;
            if (activityId) {
                $window.location = url + '?activity=' + activityId;
            }
        };

        $scope.$watch('form.selectedGame', function (selected) {
            if (selected) {
                $scope.selectedGame = selected;
                $location.search('game', selected._id);
                $scope.refreshVersions();
            }
        });

        $scope.$watch('form.selectedVersion', function (selected) {
            var oldURL = $location.absUrl();
            if (selected) {
                $location.search('version', selected._id);
                $scope.selectedVersion = selected;
            }
            if (oldURL !== $location.absUrl()) {
                $window.location = $location.absUrl();
            }

        });

        $scope.$watch('form.selectedClass', function (selected) {
            if (selected) {
                $location.search('class', selected._id);
                $scope.selectedClass = selected;
            }
        });

        $scope.$watch('form.selectedActivity', function (selected) {
            if (selected) {
                $location.search('activity', selected._id);
                $scope.selectedActivity = selected;
            }
        });

        $scope.developer = {
            name: ''
        };

            }
            }
            }
            }
    }
]);