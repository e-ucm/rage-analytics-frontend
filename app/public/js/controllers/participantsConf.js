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

// Please note that the close and dismiss bindings are from $uibModalInstance.

angular.module('participantsApp', [])
    .controller('ModalInstanceCtrl',
        function ($uibModalInstance, items) {
            var $http = items.http;
            var CONSTANTS = items.constants;
            var Classes = items.classes;

            var $ctrl = this;
            $ctrl.classId = items.classId;
            $ctrl.username = items.username;
            $ctrl.classGroups = [];
            $ctrl.classGroupings = [];

            $ctrl.selectedGroup = undefined;
            $ctrl.selectedGrouping = undefined;

            $ctrl.unlockedGroups = false;
            $ctrl.unlockedGroupings = false;

            $ctrl.$onInit = function () {
                Classes.get({classId: $ctrl.classId}).$promise.then(function (data) {
                    $ctrl.class = data;
                    if (data.groupings && data.groupings.length > 0) {
                        $ctrl.unlockGroupings();
                    } else if (data.groups && data.groups.length > 0) {
                        $ctrl.unlockGroups();
                    }
                });
                updateGroups();
                updateGroupings();
            };

            var updateGroups = function () {
                var route = CONSTANTS.PROXY + '/classes/' + $ctrl.classId + '/groups';
                $http.get(route).success(function (data) {
                    $ctrl.classGroups = data;
                }).error(function (data, status) {
                    console.error('Error on put' + route + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            var updateGroupings = function () {
                var route = CONSTANTS.PROXY + '/classes/' + $ctrl.classId + '/groupings';
                $http.get(route).success(function (data) {
                    $ctrl.classGroupings = data;
                }).error(function (data, status) {
                    console.error('Error on put' + route + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            $ctrl.unlockGroups = function() {
                var route = CONSTANTS.PROXY + '/classes/' + $ctrl.class._id + '/remove';
                if ($ctrl.unlockedGroupings) {
                    $http.put(route, {groupings: $ctrl.class.groupings}).success(function (data) {
                        $ctrl.class = data;
                        $ctrl.unlockedGroupings = false;
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
                if ($ctrl.unlockedGroups) {
                    $http.put(route, {groups: $ctrl.class.groups}).success(function (data) {
                        $ctrl.class = data;
                        $ctrl.unlockedGroups = false;
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                } else {
                    $ctrl.unlockedGroups = true;
                }
            };

            $ctrl.unlockGroupings = function() {
                var route = CONSTANTS.PROXY + '/classes/' + $ctrl.class._id + '/remove';
                if ($ctrl.unlockedGroups) {
                    $http.put(route, {groups: $ctrl.class.groups}).success(function (data) {
                        $ctrl.class = data;
                        $ctrl.unlockedGroups = false;
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
                if ($ctrl.unlockedGroupings) {
                    $http.put(route, {groupings: $ctrl.class.groupings}).success(function (data) {
                        $ctrl.class = data;
                        $ctrl.unlockedGroupings = false;
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                } else {
                    $ctrl.unlockedGroupings = true;
                }
            };

            $ctrl.checkGroup = function (group) {
                var route = CONSTANTS.PROXY + '/classes/' + $ctrl.class._id;
                if ($ctrl.class.groups && $ctrl.class.groups.indexOf(group._id) !== -1) {
                    route += '/remove';
                }
                $http.put(route, {groups: [group._id]}).success(function (data) {
                    $ctrl.class = data;
                }).error(function (data, status) {
                    console.error('Error on put' + route + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            $ctrl.checkGrouping = function (grouping) {
                var route = CONSTANTS.PROXY + '/classes/' + $ctrl.class._id;
                if ($ctrl.class.groupings && $ctrl.class.groupings.indexOf(grouping._id) !== -1) {
                    route += '/remove';
                }
                $http.put(route, {groupings: [grouping._id]}).success(function (data) {
                    $ctrl.class = data;
                }).error(function (data, status) {
                    console.error('Error on put' + route + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            $ctrl.selectGroup = function (group) {
                if ($ctrl.selectedGroup && $ctrl.selectedGroup._id === group._id) {
                    $ctrl.selectedGroup = undefined;
                } else {
                    $ctrl.selectedGroup = group;
                }

                $ctrl.selectedGrouping = undefined;
            };

            $ctrl.isInSelectedGroup = function (usr, role, group) {
                if (group) {
                    return group.participants[role].indexOf(usr) !== -1;
                }
                if ($ctrl.selectedGroup) {
                    return $ctrl.selectedGroup.participants[role].indexOf(usr) !== -1;
                }
                return false;
            };

            $ctrl.selectGrouping = function (grouping) {
                if ($ctrl.selectedGrouping && $ctrl.selectedGrouping._id === grouping._id) {
                    $ctrl.selectedGrouping = undefined;
                } else {
                    $ctrl.selectedGrouping = grouping;
                }

                $ctrl.selectedGroup = undefined;
            };

            $ctrl.getGroupThClass = function(group) {
                if ($ctrl.selectedGroup && $ctrl.selectedGroup._id === group._id) {
                    return 'bg-success';
                }
                if ($ctrl.selectedGrouping && $ctrl.isInSelectedGrouping(group._id, 'group')) {
                    return 'bg-warning';
                }
                return '';
            };

            $ctrl.getUserThClass = function(usr, role) {
                if ($ctrl.selectedGroup && $ctrl.isInSelectedGroup(usr, role)) {
                    return 'bg-success';
                }
                if ($ctrl.selectedGrouping && $ctrl.isInSelectedGrouping(usr, role)) {
                    return 'bg-warning';
                }
                return '';
            };

            $ctrl.isInSelectedGrouping = function (id, role) {
                if ($ctrl.selectedGrouping) {
                    if (role === 'group') {
                        return $ctrl.selectedGrouping.groups.indexOf(id) !== -1;
                    }

                    for (var i = 0; i < $ctrl.selectedGrouping.groups.length; i++) {
                        for (var j = 0; j < $ctrl.classGroups.length; j++) {
                            if ($ctrl.classGroups[j]._id === $ctrl.selectedGrouping.groups[i]) {
                                if ($ctrl.isInSelectedGroup(id, role, $ctrl.classGroups[j])) {
                                    return true;
                                }
                            }
                        }

                    }

                }
                return false;
            };

            // Teachers
            $ctrl.isRemovable = function (tea) {
                var teachers = $ctrl.class.participants.teachers;
                if (teachers && teachers.length === 1) {
                    return false;
                }
                if ($ctrl.username === tea) {
                    return false;
                }
                return true;
            };

            $ctrl.inviteUser = function (role) {
                var object = {participants: {}};
                var user;
                switch (role) {
                    case 'teacher': {
                        user = $ctrl.teacher.name;
                        object.participants = {teachers: user};
                        break;
                    }
                    case 'assistant': {
                        user = $ctrl.assistant.name;
                        object.participants = {assistants: user};
                        break;
                    }
                    case 'student': {
                        user = $ctrl.student.name;
                        object.participants = {students: user};
                        break;
                    }
                }
                if (user && user.trim() !== '') {
                    var route = CONSTANTS.PROXY + '/classes/' + $ctrl.class._id;
                    $http.put(route, object).success(function (data) {
                        $ctrl.class = data;
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };

            $ctrl.ejectUser = function (user, role) {
                var object = {participants: {}};
                switch (role) {
                    case 'teacher': {
                        object.participants = {teachers: user};
                        break;
                    }
                    case 'assistant': {
                        object.participants = {assistants: user};
                        break;
                    }
                    case 'student': {
                        object.participants = {students: user};
                        break;
                    }
                }
                var route = CONSTANTS.PROXY + '/classes/' + $ctrl.class._id + '/remove';
                $http.put(route, object).success(function (data) {
                    $ctrl.class = data;
                }).error(function (data, status) {
                    console.error('Error on put' + route + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            };

            $ctrl.addCsvClass = function () {
                var students = [];
                $ctrl.fileContent.contents.trim().split(',').forEach(function (student) {
                    if (student) {
                        students.push(student);
                    }
                });
                var route = CONSTANTS.PROXY + '/classes/' + $ctrl.selectedClass._id;
                $http.put(route, {participants: {students: students}}).success(function (data) {
                    $ctrl.class = data;
                }).error(function (data, status) {
                    console.error('Error on put', route, status);
                });
            };

            $ctrl.createGroup = function () {
                if ($ctrl.group.name && $ctrl.group.name.trim() !== '') {
                    var route = CONSTANTS.PROXY + '/classes/' + $ctrl.class._id + '/groups';
                    $http.post(route, {
                        name: $ctrl.group.name,
                        participants: {students: [], assistants: []}
                    }).success(function (data) {
                        updateGroups();
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };

            $ctrl.modifyGroup = function (usr, role, toAdd) {
                if ($ctrl.selectedGroup) {
                    var route;
                    if (toAdd) {
                        route = CONSTANTS.PROXY + '/classes/groups/' + $ctrl.selectedGroup._id;
                    } else {
                        route = CONSTANTS.PROXY + '/classes/groups/' + $ctrl.selectedGroup._id + '/remove';
                    }
                    var participants = {participants: {students: [], assistants: [], teachers: []}};
                    switch (role) {
                        case 'student': {
                            participants.participants.students.push(usr);
                            break;
                        }
                        case 'assistant': {
                            participants.participants.assistants.push(usr);
                            break;
                        }
                        case 'teacher': {
                            participants.participants.teachers.push(usr);
                            break;
                        }
                    }
                    $http.put(route, participants).success(function (data) {
                        $ctrl.selectedGroup = data;
                        updateGroups();
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };

            $ctrl.removeGroup = function (group) {
                if ($ctrl.group.name && $ctrl.group.name.trim() !== '') {
                    var route = CONSTANTS.PROXY + '/classes/groups/' + group._id;
                    $http.delete(route).success(function (data) {
                        updateGroups();
                    }).error(function (data, status) {
                        console.error('Error on delete' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };

            $ctrl.createGrouping = function () {
                if ($ctrl.grouping.name && $ctrl.grouping.name.trim() !== '') {
                    var route = CONSTANTS.PROXY + '/classes/' + $ctrl.class._id + '/groupings';
                    $http.post(route, {name: $ctrl.grouping.name, groups: []}).success(function (data) {
                        updateGroupings();
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };

            $ctrl.modifyGrouping = function (group, toAdd) {
                if ($ctrl.selectedGrouping) {
                    var route;
                    if (toAdd) {
                        route = CONSTANTS.PROXY + '/classes/groupings/' + $ctrl.selectedGrouping._id;
                    } else {
                        route = CONSTANTS.PROXY + '/classes/groupings/' + $ctrl.selectedGrouping._id + '/remove';
                    }
                    $http.put(route, {groups: [group._id]}).success(function (data) {
                        $ctrl.selectedGrouping = data;
                        updateGroupings();
                    }).error(function (data, status) {
                        console.error('Error on put' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };

            $ctrl.removeGrouping = function (grouping) {
                if ($ctrl.grouping.name && $ctrl.grouping.name.trim() !== '') {
                    var route = CONSTANTS.PROXY + '/classes/groupings/' + grouping._id;
                    $http.delete(route).success(function (data) {
                        updateGroupings();
                    }).error(function (data, status) {
                        console.error('Error on delete' + route + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };
        }
    );
