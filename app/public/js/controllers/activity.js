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
    .config(['$locationProvider',
        function ($locationProvider) {
            $locationProvider.html5Mode(false);
        }
    ])
    .directive('reports', function () {
        return function (scope, element, attrs) {
            new RadialProgress(angular.element(element).children('.progress-marker')[0], scope.result.progress);
            new ColumnProgress(angular.element(element).children('.score-marker')[0], scope.result.score);
        };
    })
    .controller('ActivityCtrl', ['$scope', '$location', '$http', 'ActivitiesId', 'Results', 'Versions', 'QueryParams', '$sce', 'CONSTANTS', 'Role',
        function ($scope, $location, $http, ActivitiesId, Results, Versions, QueryParams, $sce, CONSTANTS, Role) {

            $scope.isTeacher = function () {
                return Role.isTeacher();
            };

            $scope.refreshResults = function () {
                var rawResults = Results.query({
                        id: $scope.activity._id
                    },
                    function () {
                        calculateResults(rawResults);
                    });
            };

            var activityId = QueryParams.getQueryParam('activity');
            if (activityId) {
                $scope.activity = ActivitiesId.get({
                    id: activityId
                }, function () {
                    $scope.version = Versions.get({
                        gameId: $scope.activity.gameId,
                        versionId: $scope.activity.versionId
                    }, function () {
                        $scope.refreshResults();
                        if (!$scope.activity.end) {
                            setInterval(function () {
                                $scope.refreshResults();
                            }, 10000);
                        }
                    });
                });
            }

            var evalExpression = function (expression, defaultValue) {
                try {
                    return eval(expression) || defaultValue;
                } catch (err) {
                    return defaultValue;
                }
            };


            var dashboardLink = function (userName) {
                var url = CONSTANTS.KIBANA + '/app/kibana#/dashboard/dashboard_' +
                    QueryParams.getQueryParam('activity') + '?embed=true_g=(refreshInterval:(display:\'5%20seconds\',' +
                    'pause:!f,section:1,value:5000),time:(from:now-1h,mode:quick,to:now))';
                if (url.startsWith('localhost')) {
                    url = 'http://' + url;
                }

                if (userName) {
                    url += '&_a=(filters:!(),options:(darkTheme:!f),query:(query_string:(analyze_wildcard:!t,query:\'name:' +
                        userName + '\')))';
                } else if ($scope.player) {
                    url += '&_a=(filters:!(),options:(darkTheme:!f),query:(query_string:(analyze_wildcard:!t,query:\'name:' +
                        $scope.player.name + '\')))';
                }

                if (url.startsWith('localhost')) {
                    url = 'http://' + url;
                }

                return $sce.trustAsResourceUrl(url);
            };
            $scope.iframeDashboardUrl = dashboardLink();
            $scope.studentIframe = dashboardLink($scope.$storage.user.username);

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