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
    .factory('_', ['$window', function ($window) {
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
    .directive('fileModel', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;
                element.bind('change', function () {
                    scope.$apply(function () {
                        modelSetter(scope, element[0].files[0]);
                    });
                });
            }
        };
    }])
    .controller('ActivityCtrl', ['$rootScope', '$scope', '$attrs', '$location', '$http', 'Activities', 'Classes', '_',
        'Results', 'Versions', 'Groups', 'Groupings', '$sce', '$interval', 'Role', 'CONSTANTS',
        function ($rootScope, $scope, $attrs, $location, $http, Activities, Classes, _, Results,
                  Versions, Groups, Groupings, $sce, $interval, Role, CONSTANTS) {

            var refresh;
            var groupsReady = false;
            var groupingsReady = false;
            var classReady = false;
            $scope.class = {};
            var onSetActivity = function () {
                Classes.get({classId: $scope.activity.classId}).$promise.then(function (c) {
                    classReady = true;
                    $scope.class = c;
                    if ($scope.activity.groupings && $scope.activity.groupings.length > 0) {
                        $scope.unlockGroupings();
                    } else if ($scope.activity.groups && $scope.activity.groups.length > 0) {
                        $scope.unlockGroups();
                    }
                    updateGroups();
                    updateGroupings();
                    $scope.refreshResults = function () {
                        if (Role.isUser()) {
                            if (!$scope.gameplaysShown) {
                                $scope.gameplaysShown = {};
                            }
                            if (Role.isTeacher()) {
                                Activities.attempts({activityId: $scope.activity._id}, function (attempts) {
                                    $scope.attempts = attempts;
                                });
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
                });
            };

            var updateGroups = function () {
                var route = CONSTANTS.PROXY + '/classes/' + $scope.class._id + '/groups';
                $http.get(route).success(function (data) {
                    $scope.classGroups = data;
                }).error(function (data, status) {
                    console.error('Error on put' + route + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            var updateGroupings = function () {
                var route = CONSTANTS.PROXY + '/classes/' + $scope.class._id + '/groupings';
                $http.get(route).success(function (data) {
                    $scope.classGroupings = data;
                }).error(function (data, status) {
                    console.error('Error on put' + route + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.$on('$destroy', function () {
                if (refresh) {
                    $interval.cancel(refresh);
                }
            });

            $attrs.$observe('activityid', function () {
                $scope.activity = Activities.get({activityId: $attrs.activityid}, onSetActivity);
                updateOfflineTraces();
            });

            $attrs.$observe('activity', function () {
                groupsReady = false;
                groupingsReady = false;
                classReady = false;
                $scope.activity = JSON.parse($attrs.activity);
                Activities.get({activityId: $scope.activity._id}).$promise.then(function (a) {
                    $scope.activity = a;
                    onSetActivity();
                    updateOfflineTraces();
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


            var dashboardLink = function (userName, attempt) {
                var url = CONSTANTS.KIBANA + '/app/kibana#/dashboard/dashboard_' +
                    $scope.activity._id + '?embed=true_g=(refreshInterval:(display:\'5%20seconds\',' +
                    'pause:!f,section:1,value:5000),time:(from:now-1h,mode:quick,to:now))';
                if (url.startsWith('localhost')) {
                    url = 'http://' + url;
                }
                var filter = {};

                if (userName) {
                    filter.name = userName;
                } else if ($scope.player) {
                    filter.name = $scope.player.name;
                }

                if (attempt) {
                    filter.session = attempt;
                } else if ($scope.attempt) {
                    filter.session = $scope.attempt.number;
                }

                if (filter.length > 0) {
                    var props = [];
                    for (var key in filter) {
                        if (filter.hasOwnProperty(key)) {
                            props.push(key + ': ' + filter[key]);
                        }
                    }
                    url += '&_a=(filters:!(),options:(darkTheme:!f),query:(query_string:(analyze_wildcard:!t,query:\'' + props.join(',') + '\')))';
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
                $scope.attempt = null;
                $scope.iframeDashboardUrl = dashboardLink();
            };

            $scope.viewPlayer = function (result) {
                $scope.player = result;
                $scope.attempt = null;
                $scope.iframeDashboardUrl = dashboardLink();
            };

            $scope.viewAttempt = function (gameplay, attempt) {
                if ($scope.results) {
                    var lookForName = gameplay.playerType === 'anonymous' ? gameplay.animalName : gameplay.playerName;
                    for (var i = 0; i < $scope.results.length; i++) {
                        if ($scope.results[i].name === lookForName) {
                            $scope.player = $scope.results[i];
                            break;
                        }
                    }
                }
                // This code manually changes the tab, this might be solved with tab('show') in newer versions
                // as mentioned in https://github.com/twbs/bootstrap/issues/23594
                $('.active[data-toggle=\'tab\']').toggleClass('active').toggleClass('show');
                $('span[href=\'#realtime\'][data-toggle=\'tab\']').toggleClass('active').toggleClass('show');
                $('.tab-pane.active').toggleClass('active').toggleClass('show');
                $('#realtime').toggleClass('active').toggleClass('show');
                $scope.attempt = attempt;
                $scope.iframeDashboardUrl = dashboardLink();
            };


            function updateOfflineTraces() {
                if ($scope.activity) {
                    $http.get(CONSTANTS.PROXY + '/offlinetraces/' + $scope.activity._id, {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined,
                            enctype: 'multipart/form-data'
                        }
                    }).then(function successCallback(response) {
                        // This callback will be called asynchronously
                        // when the response is available

                        $scope.offlinetraces = response.data;
                    }, function errorCallback(response) {
                        // Called asynchronously if an error occurs
                        // or server returns response with an error status.
                        console.error('Error on get /offlinetraces/' + $scope.activity._id + ' ' +
                            JSON.stringify(response, null, '  '));
                    });
                }
            }

            function upload(file) {
                var formData = new FormData();
                formData.append('offlinetraces', file);
                $http.post(CONSTANTS.PROXY + '/offlinetraces/' + $scope.activity._id, formData, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined,
                        enctype: 'multipart/form-data'
                    }
                }).then(function successCallback(response) {
                    // This callback will be called asynchronously
                    // when the response is available
                    updateOfflineTraces();
                }, function errorCallback(response) {
                    // Called asynchronously if an error occurs
                    // or server returns response with an error status.
                    console.error('Error on post /offlinetraces/' + $scope.activity._id + ' ' +
                        JSON.stringify(response, null, '  '));
                });
            }

            $scope.myFile = undefined;
            $scope.uploadTracesFile = function () {
                if ($scope.myFile) {
                    console.log('upload 3 ' + $scope.myFile);
                    upload($scope.myFile);
                }
            };

            // Anonymous

            $scope.anonymous = 'btn-default';

            $scope.allowAnonymous = function () {
                $scope.activity.$update();
            };

            // Students
            $scope.classGroups = [];
            $scope.classGroupings = [];

            $scope.selectedGroup = undefined;
            $scope.selectedGrouping = undefined;

            $scope.unlockedGroups = false;
            $scope.unlockedGroupings = false;

            $scope.isUsingGroupings = function () {
                return $scope.activity.groupings && $scope.activity.groupings.length > 0;
            };

            $scope.isUsingGroups = function () {
                return !$scope.isUsingGroupings() && $scope.activity.groups && $scope.activity.groups.length > 0;
            };

            $scope.unlockGroups = function () {
                var route = CONSTANTS.PROXY + '/activities/' + $scope.activity._id + '/remove';
                if ($scope.unlockedGroupings) {
                    $http.put(route, {groupings: $scope.activity.groupings}).success(function (data) {
                        $scope.activity = data;
                        $scope.unlockedGroupings = false;
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
                if ($scope.unlockedGroups) {
                    $http.put(route, {groups: $scope.activity.groups}).success(function (data) {
                        $scope.activity = data;
                        $scope.unlockedGroups = false;
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                } else {
                    $scope.unlockedGroups = true;
                }
            };

            $scope.unlockGroupings = function () {
                var route = CONSTANTS.PROXY + '/activities/' + $scope.activity._id + '/remove';
                if ($scope.unlockedGroups) {
                    $http.put(route, {groups: $scope.activity.groups}).success(function (data) {
                        $scope.activity = data;
                        $scope.unlockedGroups = false;
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
                if ($scope.unlockedGroupings) {
                    $http.put(route, {groupings: $scope.activity.groupings}).success(function (data) {
                        $scope.activity = data;
                        $scope.unlockedGroupings = false;
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                } else {
                    $scope.unlockedGroupings = true;
                }
            };

            $scope.selectGroup = function (group) {
                if ($scope.selectedGroup && $scope.selectedGroup._id === group._id) {
                    $scope.selectedGroup = undefined;
                } else {
                    $scope.selectedGroup = group;
                }

                $scope.selectedGrouping = undefined;
            };

            $scope.isInSelectedGroup = function (usr, role, group) {
                if (group) {
                    return group.participants[role].indexOf(usr) !== -1;
                }
                if ($scope.selectedGroup) {
                    return $scope.selectedGroup.participants[role].indexOf(usr) !== -1;
                }
                return false;
            };

            $scope.selectGrouping = function (grouping) {
                if ($scope.selectedGrouping && $scope.selectedGrouping._id === grouping._id) {
                    $scope.selectedGrouping = undefined;
                } else {
                    $scope.selectedGrouping = grouping;
                }

                $scope.selectedGroup = undefined;
            };

            $scope.getGroupThClass = function (group) {
                if ($scope.selectedGroup && $scope.selectedGroup._id === group._id) {
                    return 'bg-success';
                }
                if ($scope.selectedGrouping && $scope.isInSelectedGrouping(group._id, 'group')) {
                    return 'bg-warning';
                }
                return '';
            };

            $scope.getUserThClass = function (usr, role) {
                if ($scope.selectedGroup && $scope.isInSelectedGroup(usr, role)) {
                    return 'bg-success';
                }
                if ($scope.selectedGrouping && $scope.isInSelectedGrouping(usr, role)) {
                    return 'bg-warning';
                }
                return '';
            };

            $scope.isInSelectedGrouping = function (id, role) {
                if ($scope.selectedGrouping) {
                    if (role === 'group') {
                        return $scope.selectedGrouping.groups.indexOf(id) !== -1;
                    }

                    for (var i = 0; i < $scope.selectedGrouping.groups.length; i++) {
                        for (var j = 0; j < $scope.classGroups.length; j++) {
                            if ($scope.classGroups[j]._id === $scope.selectedGrouping.groups[i]) {
                                if ($scope.isInSelectedGroup(id, role, $scope.classGroups[j])) {
                                    return true;
                                }
                            }
                        }

                    }

                }
                return false;
            };

            $scope.checkGroup = function (group) {
                var route = CONSTANTS.PROXY + '/activities/' + $scope.activity._id;
                if ($scope.activity.groups && $scope.activity.groups.indexOf(group._id) !== -1) {
                    route += '/remove';
                }
                $http.put(route, {groups: [group._id]}).success(function (data) {
                    $scope.activity = data;
                }).error(function (data, status) {
                    console.error('Error on put' + route + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.checkGrouping = function (grouping) {
                var route = CONSTANTS.PROXY + '/activities/' + $scope.activity._id;
                if ($scope.activity.groupings && $scope.activity.groupings.indexOf(grouping._id) !== -1) {
                    route += '/remove';
                }
                $http.put(route, {groupings: [grouping._id]}).success(function (data) {
                    $scope.activity = data;
                }).error(function (data, status) {
                    console.error('Error on put' + route + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            // Name

            $scope.changeActivityName = function () {
                $scope.activity.$update(function () {
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

            $scope.$on('refreshActivity', function (evt, activity) {
                if ($scope.activity._id === activity._id) {
                    $scope.activity = activity;
                    updateOfflineTraces();
                    console.log('Activity updated');
                }
            });

            var finishEvent = function (activity) {
                $scope.activity = activity;
                $rootScope.$broadcast('refreshActivity', $scope.activity);
            };

            $scope.startActivity = function () {
                if (!$scope.activity || $scope.activity.loading) {
                    return;
                }

                $scope.activity.$event({event: 'start'}).$promise.then(finishEvent).fail(function (error) {
                    console.error(error);
                    $.notify('<strong>Error while opening the activity:</strong><br>If the session was recently closed it ' +
                        'might need to be cleaned by the system. <br>Please try again in a few seconds.', {
                        offset: {x: 10, y: 65},
                        type: 'danger'// jscs:ignore requireCamelCaseOrUpperCaseIdentifiers
                    });
                    $rootScope.$broadcast('refreshActivity', $scope.activity);
                });
            };

            $scope.endActivity = function () {
                if (!$scope.activity || $scope.activity.loading) {
                    return;
                }

                $scope.activity.$event({event: 'end'}).$promise.then(finishEvent).fail(function (error) {
                    console.error(error);
                    $.notify('<strong>Error while closing the activity:</strong><br>Please try again in a few seconds.', {
                        offset: {x: 10, y: 65},
                        type: 'danger'// jscs:ignore requireCamelCaseOrUpperCaseIdentifiers
                    });
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