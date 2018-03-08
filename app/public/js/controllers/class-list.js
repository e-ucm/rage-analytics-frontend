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

angular.module('classesApp', ['ngStorage', 'services'])
    .controller('ClassListCtrl', ['$scope', '$rootScope', '$location', '$http', 'Classes', 'Courses', '$timeout', 'CONSTANTS',
        function ($scope, $rootScope, $location, $http, Classes, Courses, $timeout, CONSTANTS) {
            $scope.activity = {};
            $scope.courseId = {};
            $scope.class = {};
            $scope.newCourse = {};

            $scope.editCourse = {};
            $scope.editBoxCourse = {};
            $scope.coursesTitles = {};

            $scope.goToClass = function(c) {
                $rootScope.$broadcast('selectClass', { class: c});
            };

            var getClasses = function () {
                Classes.my().$promise.then(function(classes) {
                    $scope.classes = classes;
                    refreshCoursesTitles();
                });
            };

            var getCourses = function () {
                $scope.courses = Courses.all().$promise.then(function(courses) {
                    $scope.courses = courses;
                    $scope.courses.unshift({_id: 'NEW', title: 'New Course'});
                    $scope.courses.unshift({title: 'No Course'});
                    refreshCoursesTitles();
                });
            };

            getClasses();
            getCourses();
            $scope.loading = false;

            var refreshCoursesTitles = function() {
                if ($scope.courses && $scope.classes) {
                    $scope.classes.forEach(function (cl) {
                        $scope.coursesTitles[cl.courseId] = 'No Course';
                        if (cl.courseId) {
                            for (var i = 0; $scope.courses.length; i++) {
                                if ($scope.courses[i]._id === cl.courseId) {
                                    $scope.coursesTitles[cl.courseId] = $scope.courses[i].title;
                                    break;
                                }
                            }
                        }
                    });
                }
            };

            $scope.createClass = function () {
                var c = new Classes();
                c.name = $scope.class.name ? $scope.class.name : 'New class';
                c.$save().then(function() {
                    $rootScope.$broadcast('refreshClasses');
                    $scope.goToClass(c);
                });
            };

            $scope.editBox = function(classObj) {
                return $scope.editBoxCourse[classObj._id];
            };

            $scope.showSelectBox = function(classObj) {
                return $scope.editCourse[classObj._id];
            };

            $scope.editCourseClass = function (classObj) {
                Object.keys($scope.editCourse).forEach(function(key) {
                    $scope.editCourse[key] = false;
                    $scope.editBoxCourse[classObj._id] = false;
                });
                $scope.editCourse[classObj._id] = true;
            };

            $scope.acceptCourseClass = function (classObj) {
                var courseId = $scope.courseId.id;
                if (courseId === 'NEW') {
                    if ($scope.newCourse.newName) {
                        $http.post(CONSTANTS.PROXY + '/courses', {title: $scope.newCourse.newName})
                            .success(function(data) {
                                $http.put(CONSTANTS.PROXY + '/classes/' + classObj._id, {courseId: data._id})
                                    .success(function () {
                                        getClasses();
                                    }).error(function (data, status) {
                                    console.error('Error on put /classes/' + classObj._id + ' ' +
                                        JSON.stringify(data) + ', status: ' + status);
                                });
                            }).error(function (data, status) {
                                console.error('Error on put /classes/' + classObj._id + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            }).finally(function () {
                                $scope.editBoxCourse[classObj._id] = false;
                                $scope.editCourse[classObj._id] = false;
                                $scope.newCourse = {};
                                getCourses();
                            });
                    } else {
                        $scope.editBoxCourse[classObj._id] = true;
                    }
                } else {
                    var reqObj;
                    if (!courseId) {
                        courseId = null;
                    }
                    reqObj = {courseId: courseId};
                    $http.put(CONSTANTS.PROXY + '/classes/' + classObj._id, reqObj)
                        .success(function () {
                            $scope.editCourse[classObj._id] = false;
                            getClasses();
                        }).error(function (data, status) {
                        console.error('Error on put /classes/' + classObj._id + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };

            $scope.deleteClass = function (classObj) {
                classObj.$remove().then(function() {
                    $timeout(function() {
                        $rootScope.$broadcast('refreshClasses');
                    }, 20);
                });
            };

            $scope.$on('refreshClasses', function () {
                getClasses();
            });
        }
    ]);