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

angular.module('classApp', ['ngStorage', 'services', 'ngAnimate', 'ngSanitize', 'ui.bootstrap'])
    .controller('ClassCtrl', ['$rootScope', '$scope', '$attrs', '$location', '$http', '$uibModal', 'Classes', 'Groups', 'Groupings', 'CONSTANTS',
        function ($rootScope, $scope, $attrs, $location, $http, $uibModal, Classes, Groups, Groupings, CONSTANTS) {
            var groupsReady = false;
            var groupingsReady = false;
            var classReady = false;
            var onSetClass = function() {
                if (!$scope.class) {
                    throw new Error('No class for ClassCtrl');
                } else {
                    classReady = true;
                    if (groupsReady && groupingsReady && classReady) {
                        onReadyParticipants();
                    }
                    $http.get(CONSTANTS.PROXY + '/lti/keyid/' + $scope.class._id).success(function (data) {
                        if (data && data.length > 0) {
                            $scope.lti.key = data[0]._id;
                            $scope.lti.secret = data[0].secret;
                        }
                    });
                }
            };

            var onReadyGroups = function() {
                groupsReady = true;
                if (groupsReady && groupingsReady && classReady) {
                    onReadyParticipants();
                }
            };

            var onReadyGroupings = function() {
                groupingsReady = true;
                if (groupsReady && groupingsReady && classReady) {
                    onReadyParticipants();
                }
            };

            var onReadyParticipants = function() {
                $scope.participants = {teachers: [], assistants: [], students: []};
                if ($scope.isUsingGroupings()) {
                    $scope.class.groupings.forEach(function(groupingId) {
                        addParticipantsFromGroupingId(groupingId);
                    });
                } else if ($scope.isUsingGroups()) {
                    $scope.class.groups.forEach(function(groupId) {
                        addParticipantsFromGroupId(groupId);
                    });
                } else {
                    $scope.participants = $scope.class.participants;
                }
            };

            var getClassInfo = function() {
                groupsReady = false;
                groupingsReady = false;
                classReady = false;
                $scope.class = Classes.get({classId: $attrs.classid}, onSetClass);
                $scope.groups = Groups.get({classId: $attrs.classid}, onReadyGroups);
                $scope.groupings = Groupings.get({classId: $attrs.classid}, onReadyGroupings);
            };

            var addParticipantsFromGroupingId = function(groupingId) {
                for (var i = 0; i < $scope.groupings.length; i++) {
                    if (groupingId === $scope.groupings[i]._id) {
                        for (var j = 0; j < $scope.groupings[i].groups.length; j++) {
                            addParticipantsFromGroupId($scope.groupings[i].groups[j]);
                        }
                        break;
                    }
                }
            };

            var addParticipantsFromGroupId = function(groupId) {
                for (var i = 0; i < $scope.groups.length; i++) {
                    if (groupId === $scope.groups[i]._id) {
                        pushUsrFromGroupToParticipants($scope.groups[i], 'teachers');
                        pushUsrFromGroupToParticipants($scope.groups[i], 'assistants');
                        pushUsrFromGroupToParticipants($scope.groups[i], 'students');
                        return;
                    }
                }
            };

            var pushUsrFromGroupToParticipants = function(group, role) {
                group.participants[role].forEach(function (usr) {
                    if ($scope.participants[role].indexOf(usr) === -1) {
                        $scope.participants[role].push(usr);
                    }
                });
            };

            $attrs.$observe('classid', function() {
                var myPrefix = $location.$$absUrl.split('/')[5];
                $scope.lti.launch = $location.$$protocol + '://' + $location.$$host + ':' + $location.$$port +
                    '/api/login/launch/' + myPrefix + '/' + CONSTANTS.PREFIX;
                getClassInfo();
            });

            $attrs.$observe('forclass', function() {
                $scope.class = JSON.parse($attrs.forclass);
                Classes.get({classId: $scope.class._id}).$promise.then(function(c) {
                    $scope.class = c;
                });
                onSetClass();
            });

            $scope.student = {};
            $scope.teacher = {};

            $scope.open = function (size) {
                var modalInstance = $uibModal.open({
                    animation: this.animationsEnabled,
                    templateUrl: 'participantsModal',
                    controller: 'ModalInstanceCtrl',
                    size: size,
                    controllerAs: '$scope',
                    resolve: {
                        items: function () {
                            return {
                                username: $scope.username,
                                classId: $scope.class._id,
                                classes: Classes,
                                http: $http,
                                constants: CONSTANTS
                            };
                        }
                    }
                });

                modalInstance.result.then(function () {
                }, function () {
                    getClassInfo();
                });
            };

            // Class

            $scope.changeName = function () {
                $scope.class.$update(function() {
                    $rootScope.$broadcast('refreshClasses');
                });
            };

            $scope.isUsingGroupings = function () {
                return $scope.class.groupings && $scope.class.groupings.length > 0;
            };

            $scope.isUsingGroups = function () {
                return !$scope.isUsingGroupings() && $scope.class.groups && $scope.class.groups.length > 0;
            };

            // LTI
            $scope.lti = {};
            $scope.lti.key = '';
            $scope.lti.secret = '';

            $scope.createLtiKey = function () {
                if ($scope.lti.secret) {
                    $http.post(CONSTANTS.PROXY + '/lti', {
                        secret: $scope.lti.secret,
                        classId: $scope.class._id
                    }).success(function (data) {
                        $scope.lti.key = data._id;
                        var myPrefix = $location.$$absUrl.split('/')[5];
                        $scope.lti.launch = $location.$$protocol + '://' + $location.$$host + ':' + $location.$$port +
                            '/api/login/launch/' + myPrefix + '/' + CONSTANTS.PREFIX;
                    }).error(function (data, status) {
                        console.error('Error on get /lti' + JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };
        }
    ]);

