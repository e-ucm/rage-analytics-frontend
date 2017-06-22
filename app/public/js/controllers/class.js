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

angular.module('classApp', ['ngStorage', 'services'])
    .controller('ClassCtrl', ['$scope', '$location', '$http', '$window', '$localStorage', 'Games', 'Versions',
        'ClassActivities', 'Role', 'CONSTANTS', 'QueryParams',
        function ($scope, $location, $http, $window, $localStorage, Games, Versions, ClassActivities, Role,
                  CONSTANTS, QueryParams) {
            $scope.$storage = $localStorage;
            $scope.activity = {};
            $scope.class = {};

            var getClasses = function () {
                $http.get(CONSTANTS.PROXY + '/classes/my').success(function (data) {
                    $scope.classes = data;

            $scope.student = {};
            $scope.teacher = {};

            // Class

            $scope.changeName = function () {
                $scope.class.$update(function() {
                    $rootScope.$broadcast('refreshClasses');
                });
            };

            // Teachers

            $scope.isRemovable = function (dev) {
                var teachers = $scope.class.teachers;
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
                    $scope.class.teachers.push($scope.teacher.name);
                    $scope.class.$update(function () {
                        $scope.teacher.name = '';
                    });
                }
            };

            $scope.ejectTeacher = function (teacher) {
                var route = CONSTANTS.PROXY + '/classes/' + $scope.class._id + '/remove';
                $http.put(route, {teachers: teacher}).success(function (data) {
                    $scope.class.teachers = data.teachers;
                }).error(function (data, status) {
                    console.error('Error on put' + route + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            // Students

            $scope.inviteStudent = function () {
                if ($scope.student.name && $scope.student.name.trim() !== '') {
                    var route = CONSTANTS.PROXY + '/classes/' + $scope.class._id;
                    $http.put(route, {students: $scope.student.name}).success(function (data) {
                        $scope.class = data;
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };


            $scope.ejectStudent = function (student, fromClass) {
                var route = '';
                if (fromClass) {
                    route = CONSTANTS.PROXY + '/classes/' + $scope.selectedClass._id + '/remove';
                } else {
                    route = CONSTANTS.PROXY + '/activities/' + $scope.selectedActivity._id + '/remove';
                }
                $http.put(route, {students: student}).success(function (data) {
                    $scope.class = data;
                }).error(function (data, status) {
                    console.error('Error on put' + route + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.addCsvClass = function () {
                var students = [];
                $scope.fileContent.contents.trim().split(',').forEach(function (student) {
                    if (student) {
                        students.push(student);
                    }
                });
                var route = CONSTANTS.PROXY + '/classes/' + $scope.selectedClass._id;
                $http.put(route, {students: students}).success(function (data) {
                    $scope.class.students = data.students;
                }).error(function (data, status) {
                    console.error('Error on put', route, status);
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