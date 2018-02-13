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

angular.module('activityApp', ['myApp', 'ngStorage', 'services'])
    .factory('_', ['$window', function($window) {
        return $window._;
    }])
    .config(['$locationProvider',
        function ($locationProvider) {
            $locationProvider.html5Mode(false);
        }
    ])
    .directive('reports', function () {
        return function (scope, element) {
            new RadialProgress(angular.element(element).children('.progress-marker')[0], scope.result.progress);
            new ColumnProgress(angular.element(element).children('.score-marker')[0], scope.result.score);
        };
    })
    .controller('ActivityCtrl', ['$rootScope', '$scope', '$attrs', '$location', '$http', 'Activities', 'Classes', '_',
        'Results', 'Versions', '$sce', '$interval', 'Role', 'CONSTANTS',
        function ($rootScope, $scope, $attrs, $location, $http, Activities, Classes, _, Results, Versions, $sce, $interval, Role, CONSTANTS) {

            var refresh;
            var onSetActivity = function() {
                $scope.refreshResults = function () {
                    if (Role.isUser()) {
                        /*$scope.activity.$myAttempts(function (myAttempts) {
                            $scope.myAttempts = myAttempts;
                        });*/
                        if (!$scope.gameplaysShown) {
                            $scope.gameplaysShown = {};
                        }
                        if (Role.isTeacher()) {
                            Activities.attempts({activityId: $scope.activity._id}, function (attempts) {
                                $scope.attempts = attempts;
                            });
                            /*$scope.activity.$attempts(function (attempts) {
                                $scope.attemps = attempts;
                            });*/
                        }
                    }
                    var rawResults = Results.query({
                            id: $scope.activity._id
                        },
                        function () {
                            calculateResults(rawResults);
                        });
                };

                if (!$attrs.lite) {
                    $scope.iframeDashboardUrl = dashboardLink();
                    $scope.studentIframe = dashboardLink($scope.$storage.user.username);

                    $scope.version = Versions.get({
                        gameId: $scope.activity.gameId,
                        versionId: $scope.activity.versionId
                    }, function () {
                        $scope.refreshResults();
                        if (!$scope.activity.end) {
                            refresh = $interval(function () {
                                $scope.refreshResults();
                            }, 10000);
                        }
                    });
                }
            };

            $scope.$on('$destroy', function() {
                if (refresh) {
                    $interval.cancel(refresh);
                }
            });

            $attrs.$observe('activityid', function() {
                $scope.activity = Activities.get({activityId: $attrs.activityid}, onSetActivity);
            });

            $attrs.$observe('activity', function() {
                $scope.activity = JSON.parse($attrs.activity);
                Activities.get({activityId: $scope.activity._id}).$promise.then(function(a) {
                    $scope.activity = a;
                    onSetActivity();
                });
            });

            $scope.student = {};
            $scope.teacher = {};


            var evalExpression = function (expression, defaultValue) {
                try {
                    return eval(expression) || defaultValue;
                } catch (err) {
                    return defaultValue;
                }
            };


            var dashboardLink = function (userName) {
                var url = CONSTANTS.KIBANA + '/app/kibana#/dashboard/dashboard_' +
                    $scope.activity._id + '?embed=true_g=(refreshInterval:(display:\'5%20seconds\',' +
                    'pause:!f,section:1,value:5000),time:(from:now-1h,mode:quick,to:now))';
                if (url.startsWith('localhost')) {
                    url = 'http://' + url;
                }

                if (userName) {
                    url += '&_a=(filters:!(),options:(darkTheme:!f),query:(query_string:(analyze_wildcard:!t,query:\'out.name:' +
                        userName + '\')))';
                } else if ($scope.player) {
                    url += '&_a=(filters:!(),options:(darkTheme:!f),query:(query_string:(analyze_wildcard:!t,query:\'out.name:' +
                        $scope.player.name + '\')))';
                }

                if (url.startsWith('localhost')) {
                    url = 'http://' + url;
                }

                return $sce.trustAsResourceUrl(url);
            };

            var calculateResults = function (rawResults) {
                var results = [];
                rawResults.forEach(function (result) {
                    $scope.version.alias = $scope.version.alias ? $scope.version.alias : 'this.name';
                    result.name = evalExpression.call(result, $scope.version.alias, 'Unknown');

                    result.warnings = [];
                    for (var i = 0; $scope.version.warnings && i < $scope.version.warnings.length; i++) {
                        var warning = $scope.version.warnings[i];
                        if (evalExpression.call(result, warning.cond, false)) {
                            result.warnings.push(i);
                        }
                    }

                    result.alerts = [];
                    for (i = 0; $scope.version.alerts && i < $scope.version.alerts.length; i++) {
                        var alert = $scope.version.alerts[i];
                        var level = evalExpression.call(result, alert.value, 0);
                        if (level - ((result.levels && result.levels[i]) || 0) >= alert.maxDiff) {
                            result.alerts.push({
                                id: i,
                                level: level
                            });
                        }
                    }
                    results.push(result);

                    if ($scope.player && $scope.player._id === result._id) {
                        $scope.player = result;
                    }

                });

                $scope.results = results;
            };

            $scope.viewAll = function () {
                $scope.player = null;
                $scope.iframeDashboardUrl = dashboardLink();
            };

            $scope.viewPlayer = function (result) {
                $scope.player = result;
                $scope.iframeDashboardUrl = dashboardLink();
            };

            // Anonymous

            $scope.anonymous = 'btn-default';

            $scope.allowAnonymous = function () {
                $scope.activity.$update();
            };

            // Teachers

            $scope.isRemovable = function (dev) {
                var teachers = $scope.activity.teachers;
                if (teachers && teachers.length === 1) {
                    return false;
                }
                if ($scope.username === dev) {
                    return false;
                }
                return true;
            };

            $scope.inviteTeacher = function () {
                if ($scope.teacher.name && $scope.teacher.name.trim() !== '') {
                    $scope.activity.teachers.push($scope.teacher.name);
                    $scope.activity.$update(function() {
                        $scope.teacher.name = '';
                    });
                }
            };

            $scope.ejectTeacher = function (teacher) {
                var route = CONSTANTS.PROXY + '/activities/' + $scope.activity._id + '/remove';
                $http.put(route, {teachers: teacher}).success(function (data) {
                    $scope.activity.teachers = data.teachers;
                }).error(function (data, status) {
                    console.error('Error on put' + route + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            // Students

            $scope.inviteStudent = function () {
                if ($scope.student.name && $scope.student.name.trim() !== '') {
                    var route = CONSTANTS.PROXY + '/activities/' + $scope.activity._id;
                    $http.put(route, {students: $scope.student.name}).success(function (data) {
                        $scope.student.name = '';
                        $scope.activity.students = data.students;
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }

            };

            $scope.ejectStudent = function (student) {
                var route = CONSTANTS.PROXY + '/activities/' + $scope.activity._id + '/remove';
                $http.put(route, {students: student}).success(function (data) {
                    $scope.activity.students = data.students;
                }).error(function (data, status) {
                    console.error('Error on put' + route + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.updateActivityToClass = function () {
                Classes.get({classId: $scope.activity.classId}).$promise.then(function(c) {
                    angular.extend($scope.activity.students, c.students);
                    $scope.activity.$update();
                });
            };

            $scope.resetActivityToClass = function () {

                Classes.get({classId: $scope.activity.classId}).$promise.then(function(c) {

                    var toRemove = _.difference($scope.activity.students, c.students);
                    $scope.activity.students = _.intersection($scope.activity.students, c.students);
                    var then = function() {
                        angular.extend($scope.activity.students, c.students);
                        $scope.activity.$update();
                    };
                    if (toRemove.length > 0) {
                        removeStudentsFromActivity(toRemove, then);
                    } else {
                        then();
                    }
                });
            };

            var removeStudentsFromActivity = function (students, then) {
                if (students.length > 0) {
                    var route = CONSTANTS.PROXY + '/activities/' + $scope.activity._id + '/remove';
                    $http.put(route, {students: students}).success(function (data) {
                        $scope.activity.students = data.students;
                        then();
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };

            $scope.addCsvActivity = function () {
                var students = [];
                $scope.fileContent.contents.trim().split(',').forEach(function (student) {
                    if (student) {
                        students.push(student);
                    }
                });
                var route = CONSTANTS.PROXY + '/activities/' + $scope.activity._id;
                $http.put(route, {students: students}).success(function (data) {
                    $scope.activity.students = data.students;
                }).error(function (data, status) {
                    console.error('Error on put', route, status);
                });
            };


            // Name

            $scope.changeActivityName = function () {
                $scope.activity.$update(function() {
                    $rootScope.$broadcast('refreshClasses');
                });
            };

            // Realtime control

            /**
             * ActivityState returns the state of the activity from one of the next possible states:
             *  - 0: Stopped
             *  - 1: Loading
             *  - 2: Open
             *
             * @param activity
             * @returns {*|boolean}
             */
            $scope.activityState = function () {
                if (!$scope.activity || $scope.activity.loading) {
                    return 1;
                }

                return $scope.activity.start && !$scope.activity.end ? 2 : 0;
            };

            $scope.$on('refreshActivity', function(evt, activity) {
                $scope.activity = activity;
                console.log('Activity updated');
            });

            $scope.startActivity = function () {
                if (!$scope.activity || $scope.activity.loading) {
                    return;
                }

                $scope.activity.loading = true;
                $http.post(CONSTANTS.PROXY + '/activities/' + $scope.activity._id + '/event/start').success(function (s) {
                    $scope.activity.loading = false;
                    $scope.activity.start = s.start;
                    $scope.activity.end = s.end;
                    $rootScope.$broadcast('refreshActivity', $scope.activity);
                }).error(function (data, status) {
                    console.error('Error on get /activities/' + $scope.activity._id + '/event/start ' +
                        JSON.stringify(data) + ', status: ' + status);

                    $.notify('<strong>Error while opening the activity:</strong><br>If the session was recently closed it ' +
                        'might need to be cleaned by the system. <br>Please try again in a few seconds.', {
                        offset: { x: 10, y: 65 },
                        type: 'danger'// jscs:ignore requireCamelCaseOrUpperCaseIdentifiers
                    });

                    $scope.activity.loading = false;
                    $rootScope.$broadcast('refreshActivity', $scope.activity);
                });
            };

            $scope.endActivity = function () {
                if (!$scope.activity || $scope.activity.loading) {
                    return;
                }

                $scope.activity.loading = true;
                $http.post(CONSTANTS.PROXY + '/activities/' + $scope.activity._id + '/event/end').success(function (s) {
                    $scope.activity.loading = false;
                    $scope.activity.start = s.start;
                    $scope.activity.end = s.end;
                    $rootScope.$broadcast('refreshActivity', $scope.activity);
                }).error(function (data, status) {
                    console.error('Error on get /activities/' + $scope.activity._id + '/event/end ' +
                        JSON.stringify(data) + ', status: ' + status);

                    $.notify('<strong>Error while closing the activity:</strong><br>Please try again in a few seconds.', {
                        offset: { x: 10, y: 65 },
                        type: 'danger'// jscs:ignore requireCamelCaseOrUpperCaseIdentifiers
                    });

                    $scope.activity.loading = false;
                    $rootScope.$broadcast('refreshActivity', $scope.activity);
                });
            };

            $scope.$watch('iframeDashboardUrl', function (newValue, oldValue) {
                var iframeObj = document.getElementById('dashboardIframe');
                if (iframeObj) {
                    iframeObj.src = newValue;
                    iframeObj.contentWindow.location.reload();
                }
            });

            $scope.$watch('studentIframe', function (newValue, oldValue) {
                var iframeObj = document.getElementById('dashboardIframeStudent');
                if (iframeObj) {
                    iframeObj.src = newValue;
                    iframeObj.contentWindow.location.reload();
                }
            });

            $scope.updateLevels = function (player) {
                var levels = player.levels || [];

                player.alerts.forEach(function (alert) {
                    levels[alert.id] = alert.level;
                });
                delete player.alerts;
                player.levels = levels;
                player.$save({id: $scope.activity._id}, function () {
                    $scope.player = null;
                    $scope.refreshResults();
                });
            };

            $scope.deleteUserData = function (name) {
                $http.delete(CONSTANTS.PROXY + '/activities/data/' + $scope.activity._id + '/' + name).success(function () {
                }).error(function (err) {
                    console.error(err);
                });
            };
        }
    ]);