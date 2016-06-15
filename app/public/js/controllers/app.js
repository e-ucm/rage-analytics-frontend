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
    'ngRoute', 'signupApp', 'loginApp', 'homeApp', 'classApp', 'gameApp', 'dataApp', 'sessionApp', 'analyticsApp', 'services', 'xeditable', 'env-vars',
    'ngFileUpload'
]).run(function (editableOptions) {
    editableOptions.theme = 'bs3';
}).filter('prettyDateId', function () {
    return function (_id) {
        return $.format.prettyDate(new Date(parseInt(_id.slice(0, 8), 16) * 1000));
    };
}).filter('prettyDate', function () {
    return function (date) {
        return $.format.prettyDate(new Date(date));
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
]).config(['$routeProvider', '$httpProvider', '$locationProvider',
    function ($routeProvider, $httpProvider, $locationProvider) {
        $httpProvider.interceptors.push('httpRequestInterceptor');
        $locationProvider.html5Mode({enabled: true, requireBase: false});
        $routeProvider.when('/home', {
            templateUrl: '/home',
            controller: 'HomeCtrl'
        }).when('/class', {
            templateUrl: '/class',
            controller: 'ClassCtrl'
        }).when('/game', {
            templateUrl: '/game',
            controller: 'GameCtrl'
        }).when('/login', {
            templateUrl: '/login',
            controller: 'LoginCtrl'
        }).when('/signup', {
            templateUrl: '/signup',
            controller: 'SignupCtrl'
        }).otherwise({
            redirectTo: 'login'
        });
    }
]).directive('fileReader', function () {
    return {
        scope: {
            fileReader: '='
        },
        link: function (scope, element) {
            $(element).on('change', function (changeEvent) {
                var files = changeEvent.target.files;
                if (files.length) {
                    var r = new FileReader();
                    r.onload = function (e) {
                        var contents = e.target.result;
                        scope.$apply(function () {
                            scope.fileReader = {
                                contents: contents,
                                name: files[0].name
                            };
                        });
                    };

                    r.readAsText(files[0]);
                }
            });
        }
    };
}).controller('AppCtrl', ['$scope', '$location', '$http', '$timeout', '$localStorage',
    '$window', 'Games', 'Versions', 'Sessions', 'Analysis', 'Role', 'CONSTANTS', '$sce',
    function ($scope, $location, $http, $timeout, $localStorage,
              $window, Games, Versions, Sessions, Analysis, Role, CONSTANTS, $sce) {
        $scope.$storage = $localStorage;

        $scope.isAdmin = function () {
            return $scope.isUser() &&
                $scope.$storage.user.roles && $scope.$storage.user.roles.indexOf('admin') !== -1;
        };

        $scope.isUser = function () {
            return $scope.$storage && $scope.$storage.user;
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
                console.error('Error on get /logout ' + JSON.stringify(data) + ', status: ' + status);
            });
        };

        $scope.public = 'btn-default';
        var checkPublic = function () {
            $scope.checkboxPublic = $scope.selectedGame.public ? true : false;
        };

        $scope.publicGame = function () {
            $http.post(CONSTANTS.PROXY + '/games/' + $scope.selectedGame._id, {public: $scope.checkboxPublic}).success(function (data) {
                $scope.selectedGame = data;
                checkPublic();
            }).error(function (data, status) {
                checkPublic();
                console.error('Error on post /games/' + $scope.selectedGame._id + ' ' + JSON.stringify(data) + ', status: ' + status);
            });
        };

        var route = $scope.isDeveloper() ? '/my' : '/public';
        $http.get(CONSTANTS.PROXY + '/games' + route).success(function (data) {
            $scope.games = data;
            var gameId = $location.search().game;
            if (gameId) {
                for (var i = 0; i < $scope.games.length; i++) {
                    if ($scope.games[i]._id === gameId) {
                        $scope.selectedGame = $scope.games[i];
                        checkPublic();
                    }
                }
            }
            $scope.refreshVersions();
        }).error(function (data, status) {
            console.error('Error on get /games' + route + ' ' + JSON.stringify(data) + ', status: ' + status);
        });

        $scope.changeSessionName = function () {
            $http.put(CONSTANTS.PROXY + '/sessions/' + $scope.selectedSession._id, {name: $scope.selectedSession.name}).success(function (data) {
            }).error(function (data, status) {
                console.error('Error on put /sessions/' + $scope.selectedSession._id + ' ' + JSON.stringify(data) + ', status: ' + status);
            });
        };

        $scope.changeTitle = function () {
            $http.post(CONSTANTS.PROXY + '/games/' + $scope.selectedGame._id, {title: $scope.selectedGame.title}).success(function (data) {
            }).error(function (data, status) {
                console.error('Error on post /games/' + $scope.selectedGame._id + ' ' + JSON.stringify(data) + ', status: ' + status);
            });
        };

        $scope.changeGameLink = function () {
            $http.post(CONSTANTS.PROXY + '/games/' + $scope.selectedGame._id, {link: $scope.selectedGame.link}).success(function (data) {
            }).error(function (data, status) {
                console.error('Error on post /games/' + $scope.selectedGame._id + ' ' + JSON.stringify(data) + ', status: ' + status);
            });
        };


        $scope.addCsvClass = function () {
            var students = [];
            $scope.fileContent.contents.trim().split(',').forEach(function (student) {
                if (student) {
                    /**
                     *
                     *  Parse and check the values
                     *
                     */
                    students.push(student);
                }
            });
            $http.put(CONSTANTS.PROXY + '/sessions/' + $scope.selectedSession._id, {students: students}).success(function (data) {
                $scope.refreshSessions();
            }).error(function (data, status) {
                console.error('Error on post /sessions/' + $scope.selectedSession._id + ' ' + JSON.stringify(data) + ', status: ' + status);
            });
        };

        // Upload later on form submit or something similar
        $scope.submit = function () {
            if ($scope.file) {
                if ($scope.analysis && $scope.selectedVersion._id === $scope.analysis._id) {
                    Analysis.delete({versionId: $scope.selectedVersion._id}, function () {
                        $scope.analysis = undefined;
                        $scope.upload($scope.file);
                    });
                } else {
                    $scope.upload($scope.file);
                }
            }
        };

        $scope.testIndex = 'default';
        $scope.statementSubmitted = false;
        $scope.submitStatementsFile = function () {
            $scope.statementsFile.contents = JSON.parse($scope.statementsFile.contents);
            if ($scope.statementsFile.contents) {
                $http.post(CONSTANTS.PROXY + '/sessions/test/' + $scope.selectedGame._id, $scope.statementsFile.contents)
                    .success(function(data) {
                        $scope.testIndex = data.id;
                        $scope.statementSubmitted = true;
                        $scope.generateTestVisualization();
                    }).error(function (data, status) {
                        $scope.statementSubmitted = true;
                        $scope.generateTestVisualization();
                        console.error('Error on post /sessions/test/' + $scope.selectedGame._id + ' ' + JSON.stringify(data) + ', status: ' + status);
                    });
            }

        };

        if (!$scope.selectedConfigView) {
            $scope.selectedConfigView = 'stormAnalysis';
        }

        $scope.getActiveClass = function(id) {
            if (id === $scope.selectedConfigView) {
                return 'active';
            }

            return '';
        };

        $scope.templateButtonMsg = function (opened) {
            if (opened) {
                return 'Hide default JSON';
            }

            return 'Show default JSON';
        }
;
        // ------------------------------ //
        // ------------------------------ //
        /*  CONFIG KIBANA VISUALIZATION   */
        // ------------------------------ //
        // ------------------------------ //

        $scope.currentSelectedField = {};
        $scope.dataWithField = {};
        $scope.visualizationTitle = '';

        $scope.visualizationList = [];
        $scope.selectedVisualizationList = [];
        $scope.checkboxVisualizations = {};

        $scope.visualizationFields = [];

        $scope.selectVisualization = function (visualization) {
            if ($scope.checkboxVisualizations[visualization]) {
                $http.put(CONSTANTS.PROXY + '/kibana/visualization/list/' + $scope.selectedGame._id, {visualizations: [visualization]})
                    .success(function(data) {
                        $scope.selectedVisualizationList.push(visualization);
                        var exist;
                        $http.get(CONSTANTS.PROXY + '/kibana/templates/fields/' + visualization).success(function (data) {
                            data.forEach(function (field) {
                                exist = false;
                                $scope.visualizationFields.forEach(function (currentF) {
                                    if (currentF === field) {
                                        exist = true;
                                    }
                                });
                                if (!exist) {
                                    $scope.visualizationFields.push(field);
                                }
                            });
                        }).error(function (data, status) {
                            console.error('Error on get /kibana/templates/fields' + visualization + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });

                    }).error(function (data, status) {
                    console.error('Error on post /kibana/visualization/list/' + $scope.selectedGame._id + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            } else {
                $http.delete(CONSTANTS.PROXY + '/kibana/visualization/list/' + $scope.selectedGame._id + '/' + visualization)
                    .success(function(data) {
                        $scope.selectedVisualizationList = data.visualizations;
                        // TODO remove fields
                    }).error(function (data, status) {
                    console.error('Error on post /kibana/visualization/list/' + $scope.selectedGame._id + '/' + visualization + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            }
        };

        // Submit a visualization template
        $scope.submitTemplateVisualization = function () {
            $scope.templateVisualization.contents = JSON.parse($scope.templateVisualization.contents);
            if ($scope.templateVisualization.contents) {
                $scope.visualizationTitle = $scope.templateVisualization.contents.title + '_' + $scope.selectedGame._id;
                $http.post(CONSTANTS.PROXY + '/kibana/templates/visualization/' + $scope.visualizationTitle + '/' + $scope.username,
                    $scope.templateVisualization.contents).success(function (data) {
                        $http.get(CONSTANTS.PROXY + '/kibana/templates/fields/' + $scope.visualizationTitle).success(function (data) {
                            $scope.visualizationFields = $scope.visualizationFields.concat(data);
                            $http.put(CONSTANTS.PROXY + '/kibana/visualization/list/' + $scope.selectedGame._id, {visualizations: [$scope.visualizationTitle]})
                                .success(function(data) {
                                    if ($scope.selectedVisualizationList.indexOf($scope.visualizationTitle) === -1) {
                                        $scope.selectedVisualizationList.push($scope.visualizationTitle);
                                    }
                                    if ($scope.visualizationList.indexOf($scope.visualizationTitle) === -1) {
                                        $scope.visualizationList.push($scope.visualizationTitle);
                                    }
                                    $scope.checkboxVisualizations[$scope.visualizationTitle] = true;
                                }).error(function (data, status) {
                                console.error('Error on post /kibana/visualization/list/' + $scope.selectedGame._id + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            });
                        }).error(function (data, status) {
                            console.error('Error on get /kibana/templates/fields' + $scope.visualizationTitle + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });

                        $http.post(CONSTANTS.PROXY + '/kibana/visualization/game/' + $scope.visualizationTitle, $scope.dataWithField)
                            .success(function() {

                            }).error(function (data, status) {
                            console.error('Error on post /kibana/visualization/game/' + $scope.visualizationTitle + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });
                    }).error(function (data, status) {
                        console.error('Error on post /kibana/templates/visualization/' + $scope.visualizationTitle + '/' + $scope.username + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
            }
        };

        $scope.dropfields = [];
        $scope.indexTitle = '';
        // Submit an index
        $scope.submitIndex = function () {
            $scope.index.contents = JSON.parse($scope.index.contents);
            if ($scope.index.contents) {
                $scope.indexTitle = $scope.index.contents.title;
                if ($scope.indexTitle) {
                    $http.post(CONSTANTS.PROXY + '/kibana/templates/index/' + $scope.selectedGame._id, $scope.index.contents).success(function (data) {
                        $http.get(CONSTANTS.PROXY + '/kibana/templates/fields/' + $scope.selectedGame._id).success(function (data) {
                            $scope.dropfields = data;
                        }).error(function (data, status) {
                            console.error('Error on get /kibana/templates/fields/' + $scope.selectedGame._id + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });
                    }).error(function (data, status) {
                        console.error('Error on post /kibana/templates/index/' + $scope.selectedGame._id + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            }

        };

        $scope.getSelectedFieldName = function (fieldName) {
            if ($scope.currentSelectedField[fieldName]) {
                return $scope.currentSelectedField[fieldName];
            }

            return 'Select field';
        };

        $scope.selectField = function (visualizationField, newField) {
            $scope.dataWithField[visualizationField] = newField;
            $scope.selectedVisualizationList.forEach(function (visualizationId) {
                $http.post(CONSTANTS.PROXY + '/kibana/visualization/game/' + visualizationId, $scope.dataWithField)
                    .success(function() {
                        var body = JSON.parse(JSON.stringify($scope.dataWithField).replace('.', '(dot)'));
                        $http.post(CONSTANTS.PROXY + '/kibana/visualization/tuples/fields/game/' + $scope.selectedGame._id, body).success(function (data) {

                        }).error(function (data, status) {
                            console.error('Error on get /kibana/visualization/tuples/fields/game/' + $scope.selectedGame._id + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });
                    }).error(function (data, status) {
                        console.error('Error on post /kibana/visualization/game/' + visualizationId + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                    });
            });
            $scope.currentSelectedField[visualizationField] = newField;

        };

        $scope.exampleIndex = JSON.stringify({
            title: 'indexExample',
            timeFieldName: 'time_field',
            fields: '[{\"name\":\"_index\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"indexed\":false,' +
                '\"analyzed\":false,\"doc_values\":false},' +
            '{\"name\":\"_source\",\"type\":\"_source\",\"count\":0,\"scripted\":false,\"indexed\":false,' +
                '\"analyzed\":false,\"doc_values\":false},' +
            '{\"name\":\"_id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"indexed\":false,' +
                '\"analyzed\":false,\"doc_values\":false},' +
            '{\"name\":\"_type\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"indexed\":false,' +
                '\"analyzed\":false,\"doc_values\":false},' +
            '{\"name\":\"_score\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"indexed\":false,' +
                '\"analyzed\":false,\"doc_values\":false},' +
            '{\"name\":\"time_field\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"indexed\":true,' +
                '\"analyzed\":false,\"doc_values\":true},' +
            '{\"name\":\"usernick\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"indexed\":true,' +
                '\"analyzed\":true,\"doc_values\":false},' +
            '{\"name\":\"usernick.keyword\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"indexed\":true,' +
                '\"analyzed\":false,\"doc_values\":true},' +
            '{\"name\":\"score\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"indexed\":true,' +
                '\"analyzed\":false,\"doc_values\":true}]'
        }, null, '      ');

        $scope.exampleVisualization = JSON.stringify({
                title: 'UsersScore',
                visState: '{\"title\":\"Users score\",\"type\":\"histogram\",\"params\":{' +
            '\"shareYAxis\":true,\"addTooltip\":true,\"addLegend\":true,\"scale\":\"linear\",\"mode\":\"stacked\",' +
            '\"times\":[],\"addTimeMarker\":false,\"defaultYExtents\":false,\"setYExtents\":false,\"yAxis\":{}},' +
            '\"aggs\":[{\"id\":\"3\",\"type\":\"terms\",\"schema\":\"segment\",\"params\":{' +
            '\"field\":\"usersnames.keyword\",\"size\":3,\"order\":\"desc\",\"orderBy\":\"2\"}},{\"id\":\"2\",' +
            '\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"score\"}},{\"id\":\"4\",' +
            '\"type\":\"terms\",\"schema\":\"split\",\"params\":{\"field\":\"date\",\"size\":1,\"orderAgg\":{' +
            '\"id\":\"4-orderAgg\",\"type\":\"max\",\"schema\":\"orderAgg\",\"params\":{\"field\":\"date\"}},' +
            '\"order\":\"desc\",\"orderBy\":\"custom\",\"row\":true}}],\"listeners\":{}}',
                uiStateJSON: '{}',
                description: '',
                version: 1,
                kibanaSavedObjectMeta: {
                    searchSourceJSON: '{\"index\":\"index_template\",\"query\":{\"query_string\":{\"query\":\"*\",' +
                    '\"analyze_wildcard\":true}},\"filter\":[]}'
                }
            }, null, '      ');

        $scope.addTemplateIndex = function () {
            var index = JSON.parse($scope.exampleIndex);
            if (index) {
                $http.post(CONSTANTS.PROXY + '/kibana/templates/index/' + $scope.selectedGame._id, index).success(function (data) {
                    $timeout(function () {
                        $http.get(CONSTANTS.PROXY + '/kibana/templates/fields/' + $scope.selectedGame._id).success(function (data) {
                            $scope.dropfields = data;
                        }).error(function (data, status) {
                            console.error('Error on get /kibana/templates/fields/' + $scope.selectedGame._id + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });
                    }, 500);
                }).error(function (data, status) {
                    console.error('Error on post /kibana/templates/index/' + $scope.selectedGame._id + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            }
        };

        $scope.addTemplateVisualization = function () {
            var visualization = JSON.parse($scope.exampleVisualization);
            if (visualization) {
                $scope.visualizationTitle = visualization.title + '_' + $scope.selectedGame._id;
                $http.post(CONSTANTS.PROXY + '/kibana/templates/visualization/' + $scope.visualizationTitle + '/' + $scope.username, visualization)
                    .success(function (data) {
                        $timeout(function () {
                            $http.get(CONSTANTS.PROXY + '/kibana/templates/fields/' + $scope.visualizationTitle).success(function (data) {
                                $scope.visualizationFields = $scope.visualizationFields.concat(data);
                                $http.put(CONSTANTS.PROXY + '/kibana/visualization/list/' + $scope.selectedGame._id,
                                    {visualizations: [$scope.visualizationTitle]}).success(function(data) {
                                        if ($scope.selectedVisualizationList.indexOf($scope.visualizationTitle) === -1) {
                                            $scope.selectedVisualizationList.push($scope.visualizationTitle);
                                        }
                                        if ($scope.visualizationList.indexOf($scope.visualizationTitle) === -1) {
                                            $scope.visualizationList.push($scope.visualizationTitle);
                                        }
                                        $scope.checkboxVisualizations[$scope.visualizationTitle] = true;
                                    }).error(function (data, status) {
                                    console.error('Error on post /kibana/visualization/list/' + $scope.selectedGame._id + ' ' +
                                        JSON.stringify(data) + ', status: ' + status);
                                });
                            }).error(function (data, status) {
                                console.error('Error on get /kibana/templates/fields' + $scope.visualizationTitle + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            });
                        }, 500);
                        $http.post(CONSTANTS.PROXY + '/kibana/visualization/game/' + $scope.visualizationTitle, $scope.dataWithField)
                            .success(function() {

                            }).error(function (data, status) {
                            console.error('Error on post /kibana/visualization/game/' + $scope.visualizationTitle + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });
                    }).error(function (data, status) {
                        console.error('Error on post /kibana/templates/visualization/' + $scope.visualizationTitle + '/' + $scope.username + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
            }
        };

        $scope.dashboardLink = '';

        $scope.generateTestVisualization = function() {
            var panels = [];
            var uiStates = {};

            // Add index
            $http.post(CONSTANTS.PROXY + '/kibana/index/' + $scope.selectedGame._id + '/' + $scope.testIndex, {})
                .success(function(data) {

                }).error(function (data, status) {
                console.error('Error on post /kibana/index/' + $scope.selectedGame._id + '/' + $scope.testIndex + ' ' +
                    JSON.stringify(data) + ', status: ' + status);
            });

            // Add dashboard
            var numPan = 1;
            $scope.selectedVisualizationList.forEach(function (visualizationId) {
                $http.post(CONSTANTS.PROXY + '/kibana/visualization/session/' + visualizationId + '/' + $scope.testIndex, {})
                    .success(function(data) {
                        panels.push('{\"id\":\"' + visualizationId + '_' + $scope.testIndex + '\",\"type\":\"visualization\",\"panelIndex\":' + numPan + ',' +
                            '\"size_x\":3,\"size_y\":2,\"col\":1,\"row\":' + numPan + '}');
                        uiStates['P-' + numPan] = {vis: {legendOpen: false}};
                        numPan++;

                        if (numPan > $scope.selectedVisualizationList.length) {
                            // Add dashboard
                            var dashboard = {
                                title: 'dashboard_' + $scope.testIndex,
                                hits: 0,
                                description: '',
                                panelsJSON: '[' + panels.toString() + ']',
                                optionsJSON: '{"darkTheme":false}',
                                uiStateJSON: JSON.stringify(uiStates),
                                version: 1,
                                timeRestore: false,
                                kibanaSavedObjectMeta: {
                                    searchSourceJSON: '{"filter":[{"query":{"query_string":{"query":"*","analyze_wildcard":true}}}]}'
                                }
                            };
                            $http.post(CONSTANTS.PROXY + '/kibana/dashboard/session/' + $scope.testIndex, dashboard)
                                .success(function(data) {
                                    var url = CONSTANTS.KIBANA + '/app/kibana#/dashboard/dashboard_' +
                                        $scope.testIndex + '?embed=true_g=(refreshInterval:' +
                                        '(display:Off,pause:!f,value:0),time:(from:now-5y,mode:quick,to:now))';
                                    if (url.startsWith('localhost')) {
                                        url = 'http://' + url;
                                    }
                                    $scope.dashboardLink = $sce.trustAsResourceUrl(url);
                                    document.getElementById('dashboardIframe').contentWindow.location.reload();
                                }).error(function (data, status) {
                                console.error('Error on post /kibana/dashboard/session/' + $scope.testIndex + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            });
                        }
                    }).error(function (data, status) {
                        console.error('Error on post /kibana/visualization/session/' + visualizationId + '/' + $scope.testIndex + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
            });
        };

        $scope.visualizationTitleWithoutGameId = function(visualization) {
            var re = /_\d.*/;
            var m = re.exec(visualization);
            return visualization.replace(m[0], '');
        };

        // ------------------------------ //
        /*    END KIBANA VISUALIZATION    */
        // ------------------------------ //


        // Upload on file select or drop
        $scope.upload = function (file) {
            var formData = new FormData();
            formData.append('analysis', file);
            $http.post(CONSTANTS.PROXY + '/analysis/' + $scope.selectedVersion._id, formData, {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined,
                    enctype: 'multipart/form-data'
                }
            }).then(function successCallback(response) {
                // This callback will be called asynchronously
                // when the response is available

                // Check if the version has an analysis uploaded
                updateAnalysis();
            }, function errorCallback(response) {
                // Called asynchronously if an error occurs
                // or server returns response with an error status.
                console.error('Error on post /analysis/' + $scope.selectedVersion._id + ' ' +
                    JSON.stringify(response, null, '  '));

                // Check if the version has an analysis uploaded
                updateAnalysis();
            });
        };

        $scope.inviteStudent = function () {
            $http.put(CONSTANTS.PROXY + '/sessions/' + $scope.selectedSession._id, {students: $scope.student.name}).success(function (data) {
                $scope.refreshSessions();
                $scope.student.name = '';
            }).error(function (data, status) {
                console.error('Error on post /sessions/' + $scope.selectedSession._id + ' ' +
                    JSON.stringify(data) + ', status: ' + status);
            });
        };

        $scope.ejectStudent = function (student) {
            $http.put(CONSTANTS.PROXY + '/sessions/' + $scope.selectedSession._id + '/remove', {students: student}).success(function () {
                $scope.refreshSessions();
            }).error(function (data, status) {
                console.error('Error on post /sessions/' + $scope.selectedSession._id + ' ' +
                    JSON.stringify(data) + ', status: ' + status);
            });
        };

        $scope.anonymous = 'btn-default';
        var checkAnonymous = function () {
            $scope.checkboxAns = $scope.selectedSession.allowAnonymous ? true : false;
        };

        $scope.allowAnonymous = function () {
            $http.put(CONSTANTS.PROXY + '/sessions/' + $scope.selectedSession._id, {allowAnonymous: $scope.checkboxAns}).success(function (data) {
                $scope.selectedSession = data;
                checkAnonymous();
            }).error(function (data, status) {
                checkAnonymous();
                console.error('Error on put /sessions/' + $scope.selectedSession._id + ' ' +
                    JSON.stringify(data) + ', status: ' + status);
            });
        };

        $scope.saveGame = function () {
            if ($scope.selectedGame) {
                $scope.selectedGame.$save();
            }
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
                    console.error('Error on delete /games/' + $scope.selectedGame._id + ' ' +
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
                    $scope.selectedVersion = null;
                    var versionId = $location.search().version;
                    if (versionId) {
                        for (var i = 0; i < $scope.versions.length; i++) {
                            if ($scope.versions[i]._id === versionId) {
                                $scope.selectedVersion = $scope.versions[i];
                            }
                        }
                    }

                    if (!$scope.selectedVersion) {
                        $scope.selectedVersion = $scope.versions[0];
                    }

                    $scope.form.selectedVersion = $scope.selectedVersion;

                    $scope.refreshSessions();

                    // Check if the version has an analysis uploaded
                    updateAnalysis();

                    if (callback) {
                        callback();
                    }
                });
            }
        };

        var updateAnalysis = function () {
            if ($scope.selectedVersion) {
                $scope.analysis = Analysis.get({versionId: $scope.selectedVersion._id}, function (analysis) {
                    console.log('received analysis', analysis);
                });
            }
        };

        $scope.refreshSessions = function () {
            if ($scope.selectedGame && $scope.selectedVersion) {
                $http.get(CONSTANTS.PROXY + '/games/' + $scope.selectedGame._id + '/versions/' + $scope.selectedVersion._id +
                    '/sessions/my').success(function (data) {
                    $scope.sessions = data;
                    $scope.selectedSession = null;
                    var sessionId = $location.search().session;
                    if (sessionId) {
                        for (var i = 0; i < $scope.sessions.length; i++) {
                            if ($scope.sessions[i]._id === sessionId) {
                                $scope.selectedSession = $scope.sessions[i];
                                checkAnonymous();
                            }
                        }
                    }
                }).error(function (data, status) {
                    console.error('Error on get /games/' + $scope.selectedGame._id + '/versions/' + $scope.selectedVersion._id +
                        '/sessions/my' + JSON.stringify(data) + ', status: ' + status);
                });

                $scope.testIndex = 'default' + $scope.selectedGame._id;
                $http.get(CONSTANTS.PROXY + '/kibana/templates/' + $scope.username)
                    .success(function(data) {
                        $scope.visualizationList = data;
                    }).error(function (data, status) {
                    console.error('Error on post /kibana/templates/' + $scope.username + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });

                $scope.selectedVisualizationList = [];
                $scope.visualizationFields = [];
                $scope.dropfields = [];
                $http.get(CONSTANTS.PROXY + '/kibana/visualization/list/' + $scope.selectedGame._id)
                    .success(function(data) {
                        $scope.selectedVisualizationList = data;
                        data.forEach(function (visualization) {
                            $scope.checkboxVisualizations[visualization] = true;
                            var exist;
                            $http.get(CONSTANTS.PROXY + '/kibana/templates/fields/' + visualization).success(function (data) {
                                data.forEach(function (field) {
                                    exist = false;
                                    $scope.visualizationFields.forEach(function (currentF) {
                                        if (currentF === field) {
                                            exist = true;
                                        }
                                    });
                                    if (!exist) {
                                        $scope.visualizationFields.push(field);
                                    }
                                });
                                $http.get(CONSTANTS.PROXY + '/kibana/visualization/tuples/fields/game/' + $scope.selectedGame._id).success(function (data) {
                                    $scope.currentSelectedField = JSON.parse(JSON.stringify(data).replace('(dot)', '.'));
                                }).error(function (data, status) {
                                    console.error('Error on get /kibana/visualization/tuples/fields/game/' + $scope.selectedGame._id + ' ' +
                                        JSON.stringify(data) + ', status: ' + status);
                                });
                            }).error(function (data, status) {
                                console.error('Error on get /kibana/templates/fields' + visualization + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            });
                        });
                    }).error(function (data, status) {
                    console.error('Error on post /kibana/visualization/list/' + $scope.selectedGame._id + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });


            }
        };

        $scope.hasSessions = function () {
            return ($scope.sessions ? $scope.sessions.length : 0) !== 0;
        };

        $scope.hasGames = function () {
            return ($scope.games ? $scope.games.length : 0) !== 0;
        };

        $scope.form = {
            selectedGame: null,
            selectedVersion: null,
            selectedSession: null
        };

        $scope.deselectedGameAndGo = function (href) {
            $scope.form.selectedGame = null;
            $scope.form.selectedVersion = null;
            $scope.form.selectedSession = null;
            $window.location = href;
        };

        $scope.setSelectedGame = function (game) {
            $scope.form.selectedGame = game;
            if (!game) {
                $scope.form.selectedVersion = null;
                $scope.form.selectedSession = null;
            }
        };

        $scope.setSelectedVersionAndGo = function (version) {
            $scope.form.selectedVersion = version;
        };

        $scope.setSelectedSession = function (session, url) {
            $scope.form.selectedSession = session;
            $window.location = url + '?game=' + $scope.form.selectedGame._id + '&version=' + $scope.form.selectedVersion._id + '&session=' + session._id;
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

        $scope.$watch('form.selectedSession', function (selected) {
            if (selected) {
                $location.search('session', selected._id);
                $scope.selectedSession = selected;
            }
        });
    }
]);