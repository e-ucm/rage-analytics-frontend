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
    .controller('ClassCtrl', ['$rootScope', '$scope', '$attrs', '$location', '$http', '$uibModal', 'Classes', 'CONSTANTS',
        function ($rootScope, $scope, $attrs, $location, $http, $uibModal, Classes, CONSTANTS) {
            var onSetClass = function() {
                if (!$scope.class) {
                    throw new Error('No class for ClassCtrl');
                } else {
                    $http.get(CONSTANTS.PROXY + '/lti/keyid/' + $scope.class._id).success(function (data) {
                        if (data && data.length > 0) {
                            $scope.lti.key = data[0]._id;
                            $scope.lti.secret = data[0].secret;
                        }
                    });
                }
            };

            $attrs.$observe('classid', function() {
                $scope.class = Classes.get({classId: $attrs.classid}, onSetClass);
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
                    console.log('HOLA');
                }, function () {
                    console.log('Modal dismissed at: ' + new Date());
                });
            };

            // Class

            $scope.changeName = function () {
                $scope.class.$update(function() {
                    $rootScope.$broadcast('refreshClasses');
                });
            };

            // LTI
            $scope.lti = {};
            $scope.lti.key = '';
            $scope.lti.secret = '';

            var myPrefix = $location.$$path.split('/')[3];
            $scope.lti.launch = $location.$$protocol + '://' + $location.$$host + ':' + $location.$$port +
                '/api/login/launch/' + myPrefix + '/' + CONSTANTS.PREFIX;

            $scope.createLtiKey = function () {
                if ($scope.lti.secret) {
                    $http.post(CONSTANTS.PROXY + '/lti', {
                        secret: $scope.lti.secret,
                        classId: $scope.class._id
                    }).success(function (data) {
                        $scope.lti.key = data._id;
                    }).error(function (data, status) {
                        console.error('Error on get /lti' + JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };
        }
    ]);

