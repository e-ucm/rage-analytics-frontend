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

angular.module('kibanaApp', ['ngStorage', 'services', 'ngFileUpload'])
    .directive('fileReader', function () {
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
                            console.log(scope);
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
    }).controller('KibanaCtrl', ['$scope', '$attrs', '$http', '$window', '$sce', '$timeout', 'Games', 'Versions', 'Analysis', 'Role', 'CONSTANTS',
    function ($scope, $attrs, $http, $window, $sce, $timeout, Games, Versions, Analysis, Role, CONSTANTS) {

        $scope.init = function(game, version) {
            $scope.game = game;
            $scope.version = version;
            $scope.getTempleateVisualizations();
        };

        // ------------------------------ //
        // ------------------------------ //
        /*  CONFIG KIBANA VISUALIZATION   */
        // ------------------------------ //
        // ------------------------------ //

        $scope.kibanaIndexDescription = 'Kibana and Elastic Search use "Index Patterns" to describe the structure ' +
            'of the data that they display or query. Your analysis should bundle an Index Pattern for you to use here.';
        $scope.kibanaVisualizationDescription = 'Visualization templates describe families of graphics and plots;' +
            ' a Visualization Template, ' +
            'when, combined with fields from an Index Pattern, fully describes a visualization, which can then ' +
            'be populated with data.';
        $scope.analysisDescription = 'An analysis takes data from any source (for example, interaction data ' +
            'from games) and stores it for later visualization.';

        $scope.currentSelectedField = {};
        $scope.dataWithField = {};

        $scope.visualizationTitle = '';
        $scope.visualizationList = [];

        $scope.selectedVisualizationDevList = [];
        $scope.selectedVisualizationTchList = [];

        $scope.checkboxVisualizationsDev = $scope.checkboxVisualizationsDev ? $scope.checkboxVisualizationsDev : {};
        $scope.checkboxVisualizationsTch = $scope.checkboxVisualizationsTch ? $scope.checkboxVisualizationsTch : {};

        $scope.visualizationFields = [];

        $scope.selectedIndex = '';

        $scope.waitOperation = false;

        $scope.selectVisualization = function (usr, visualizationId) {
            $scope.waitOperation = true;
            var checkboxList;
            var listVisualizations;
            var obj = {};
            var nameList = '';

            if (usr === 'dev') {
                listVisualizations = $scope.selectedVisualizationDevList ? $scope.selectedVisualizationDevList : [];
                checkboxList = $scope.checkboxVisualizationsDev ? $scope.checkboxVisualizationsDev : {};
                nameList = 'visualizationsDev';
            } else {
                listVisualizations = $scope.selectedVisualizationTchList ? $scope.selectedVisualizationTchList : [];
                checkboxList = $scope.checkboxVisualizationsTch ? $scope.checkboxVisualizationsTch : {};
                nameList = 'visualizationsTch';
            }

            if (checkboxList[visualizationId]) {
                obj[nameList] = [visualizationId];

                $http.get(CONSTANTS.PROXY + '/kibana/templates/index/' + visualizationId).success(function (data) {
                    $http.post(CONSTANTS.PROXY + '/kibana/visualization/game/' + $scope.game._id + '/' + visualizationId,
                        data._source).success(function () {
                        var body = JSON.parse(JSON.stringify($scope.dataWithField).split('.').join('(dot)'));
                        $http.post(CONSTANTS.PROXY + '/kibana/visualization/tuples/fields/game/' + $scope.game._id, body)
                            .success(function (data) {
                                $http.put(CONSTANTS.PROXY + '/kibana/visualization/list/' + $scope.game._id, obj)
                                    .success(function (data) {
                                        listVisualizations.push(visualizationId);
                                        $scope.waitOperation = false;
                                        var exist;
                                        $http.get(CONSTANTS.PROXY + '/kibana/templates/fields/' + visualizationId).success(function (data) {
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
                                            console.error('Error on get /kibana/templates/fields' + visualizationId + ' ' +
                                                JSON.stringify(data) + ', status: ' + status);
                                        });

                                    }).error(function (data, status) {
                                    console.error('Error on post /kibana/visualization/list/' + $scope.game._id + ' ' +
                                        JSON.stringify(data) + ', status: ' + status);
                                    $scope.waitOperation = false;
                                });
                            }).error(function (data, status) {
                            console.error('Error on post /kibana/visualization/tuples/fields/game/' + $scope.game._id + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });
                    }).error(function (data, status) {
                        console.error('Error on post /kibana/visualization/game/' + $scope.game._id + '/' + visualizationId + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                });
            } else {
                $http.delete(CONSTANTS.PROXY + '/kibana/visualization/list/' + $scope.game._id + '/' + usr + '/' + visualizationId)
                    .success(function (data) {
                        $scope.selectedVisualizationDevList = data.visualizationsDev;
                        $scope.selectedVisualizationTchList = data.visualizationsTch;
                        $scope.waitOperation = false;
                        // TODO remove fields
                    }).error(function (data, status) {
                    console.error('Error on post /kibana/visualization/list/' + $scope.game._id + '/' + visualizationId + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                    $scope.waitOperation = false;
                });
            }
        };

        // Submit a visualization template
        $scope.submitTemplateVisualization = function () {
            $scope.templateVisualization.contents = JSON.parse($scope.templateVisualization.contents);
            if ($scope.templateVisualization.contents) {
                var isDevVis = $scope.templateVisualization.contents.isDeveloper;
                var isTchVis = $scope.templateVisualization.contents.isTeacher;
                $http.post(CONSTANTS.PROXY + '/kibana/templates/visualization/author/' + $scope.username,
                    $scope.templateVisualization.contents).success(function (visualizationData) {
                    $timeout(function () {
                        var visualizationBodyTemplate = $scope.dataWithField;
                        visualizationBodyTemplate.visualizationTemplate = $scope.templateVisualization.contents;
                        $http.post(CONSTANTS.PROXY + '/kibana/visualization/game/' + $scope.game._id + '/' + visualizationData._id,
                            visualizationBodyTemplate).success(function () {
                            var body = JSON.parse(JSON.stringify($scope.dataWithField).split('.').join('(dot)'));
                            $http.post(CONSTANTS.PROXY + '/kibana/visualization/tuples/fields/game/' + $scope.game._id, body)
                                .success(function (data) {

                                }).error(function (data, status) {
                                console.error('Error on post /kibana/visualization/tuples/fields/game/' + $scope.game._id + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            });
                        }).error(function (data, status) {
                            console.error('Error on post /kibana/visualization/game/' + $scope.game._id + '/' + visualizationData._id + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });

                        $http.get(CONSTANTS.PROXY + '/kibana/templates/fields/' + visualizationData._id).success(function (data) {
                            var exist = false;
                            data.forEach(function (f) {
                                $scope.visualizationFields.forEach(function (currentF) {
                                    if (currentF === f) {
                                        exist = true;
                                    }
                                });
                                if (!exist) {
                                    $scope.visualizationFields.push(f);
                                }
                            });
                            var objList = {};
                            objList.visualizationsDev = [];
                            objList.visualizationsTch = [];
                            if (isDevVis) {
                                objList.visualizationsDev.push(visualizationData._id);
                            }
                            if (isTchVis) {
                                objList.visualizationsTch.push(visualizationData._id);
                            }
                            $http.put(CONSTANTS.PROXY + '/kibana/visualization/list/' + $scope.game._id,
                                objList).success(function (data) {

                                var newVisualization = {
                                    id: visualizationData._id,
                                    title: $scope.templateVisualization.contents.title
                                };
                                if ($scope.visualizationList.indexOf(newVisualization) === -1) {
                                    $scope.visualizationList.push(newVisualization);
                                }

                                if (isDevVis) {
                                    $scope.checkboxVisualizationsDev[visualizationData._id] = true;
                                    if ($scope.selectedVisualizationDevList.indexOf(visualizationData._id) === -1) {
                                        $scope.selectedVisualizationDevList.push(visualizationData._id);
                                    }
                                }
                                if (isTchVis) {
                                    $scope.checkboxVisualizationsTch[visualizationData._id] = true;
                                    if ($scope.selectedVisualizationTchList.indexOf(visualizationData._id) === -1) {
                                        $scope.selectedVisualizationTchList.push(visualizationData._id);
                                    }
                                }

                            }).error(function (data, status) {
                                console.error('Error on post /kibana/visualization/list/' + $scope.game._id + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            });
                        }).error(function (data, status) {
                            console.error('Error on get /kibana/templates/fields' + visualizationData._id + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });
                    }, 500);
                    $http.post(CONSTANTS.PROXY + '/kibana/visualization/game/' + $scope.game._id + '/' + visualizationData._id,
                        $scope.dataWithField).success(function () {

                    }).error(function (data, status) {
                        console.error('Error on post /kibana/visualization/game/' + $scope.game._id + '/' + visualizationData._id + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }).error(function (data, status) {
                    console.error('Error on post /kibana/templates/visualization/author/' + $scope.username + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            }
        };

        $scope.dropfields = [];
        $scope.index = false;
        // Submit an index
        $scope.submitIndex = function () {
            console.log($scope.index);
            if ($scope.index) {
                $scope.index.contents = JSON.parse($scope.index.contents);
                if ($scope.index.contents) {
                    $scope.indexTitle = $scope.index.contents.title;
                    if ($scope.indexTitle) {
                        $http.post(CONSTANTS.PROXY + '/kibana/templates/index/' + $scope.game._id, $scope.index.contents).success(function (data) {
                            $timeout(function () {
                                $http.get(CONSTANTS.PROXY + '/kibana/templates/fields/' + $scope.game._id).success(function (data) {
                                    $scope.dropfields = data;
                                    $scope.selectedIndex = $scope.indexTitle;
                                }).error(function (data, status) {
                                    console.error('Error on get /kibana/templates/fields/' + $scope.game._id + ' ' +
                                        JSON.stringify(data) + ', status: ' + status);
                                });
                            }, 500);
                        }).error(function (data, status) {
                            console.error('Error on post /kibana/templates/index/' + $scope.game._id + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });
                    }
                }
            }
        };

        $scope.getSelectedFieldName = function (fieldName) {
            if ($scope.currentSelectedField[fieldName]) {
                return $scope.currentSelectedField[fieldName];
            }

            if ($scope.dropfields.indexOf(fieldName) !== -1) {
                return fieldName;
            }

            return 'Select field';
        };

        $scope.selectField = function (visualizationField, newField) {
            $scope.dataWithField[visualizationField] = newField;
            $scope.selectedVisualizationDevList.forEach(function (visualization) {
                $http.post(CONSTANTS.PROXY + '/kibana/visualization/game/' + $scope.game._id + '/' + visualization.id, $scope.dataWithField)
                    .success(function () {
                        var body = JSON.parse(JSON.stringify($scope.dataWithField).split('.').join('(dot)'));
                        $http.post(CONSTANTS.PROXY + '/kibana/visualization/tuples/fields/game/' + $scope.game._id, body).success(function (data) {

                        }).error(function (data, status) {
                            console.error('Error on post /kibana/visualization/tuples/fields/game/' + $scope.game._id + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });
                    }).error(function (data, status) {
                    console.error('Error on post /kibana/visualization/game/' + $scope.game._id + '/' + visualization.id + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            });
            $scope.selectedVisualizationTchList.forEach(function (visualization) {
                $http.post(CONSTANTS.PROXY + '/kibana/visualization/game/' + $scope.game._id + '/' + visualization.id, $scope.dataWithField)
                    .success(function () {
                        var body = JSON.parse(JSON.stringify($scope.dataWithField).split('.').join('(dot)'));
                        $http.post(CONSTANTS.PROXY + '/kibana/visualization/tuples/fields/game/' + $scope.game._id, body).success(function (data) {

                        }).error(function (data, status) {
                            console.error('Error on post /kibana/visualization/tuples/fields/game/' + $scope.game._id + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });
                    }).error(function (data, status) {
                    console.error('Error on post /kibana/visualization/game/' + $scope.game._id + '/' + visualization.id + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            });
            $scope.currentSelectedField[visualizationField] = newField;

        };

        $scope.exampleIndex = JSON.stringify({
            title: 'defaultIndex',
            timeFieldName: 'timestamp',
            fields: '[' +
            '{"name":"_index","type":"string","count":0,"scripted":false,"indexed":false,"analyzed":false,"doc_values":false},' +
            '{"name":"value.keyword","type":"string","count":0,"scripted":false,"indexed":true,"analyzed":false,"doc_values":true},' +
            '{"name":"gameplayId","type":"string","count":0,"scripted":false,"indexed":true,"analyzed":true,"doc_values":false},' +
            '{"name":"response.keyword","type":"string","count":0,"scripted":false,"indexed":true,"analyzed":false,"doc_values":true},' +
            '{"name":"gameplayId.keyword","type":"string","count":0,"scripted":false,"indexed":true,"analyzed":false,"doc_values":true},' +
            '{"name":"event","type":"string","count":0,"scripted":false,"indexed":true,"analyzed":true,"doc_values":false},' +
            '{"name":"value","type":"string","count":0,"scripted":false,"indexed":true,"analyzed":true,"doc_values":false},' +
            '{"name":"versionId.keyword","type":"string","count":0,"scripted":false,"indexed":true,"analyzed":false,"doc_values":true},' +
            '{"name":"timestamp","type":"date","count":0,"scripted":false,"indexed":true,"analyzed":false,"doc_values":true},' +
            '{"name":"event.keyword","type":"string","count":0,"scripted":false,"indexed":true,"analyzed":false,"doc_values":true},' +
            '{"name":"target.keyword","type":"string","count":0,"scripted":false,"indexed":true,"analyzed":false,"doc_values":true},' +
            '{"name":"time_value","type":"number","count":0,"scripted":false,"indexed":true,"analyzed":false,"doc_values":true},' +
            '{"name":"target","type":"string","count":0,"scripted":false,"indexed":true,"analyzed":true,"doc_values":false},' +
            '{"name":"versionId","type":"string","count":0,"scripted":false,"indexed":true,"analyzed":true,"doc_values":false},' +
            '{"name":"response","type":"string","count":0,"scripted":false,"indexed":true,"analyzed":true,"doc_values":false},' +
            '{"name":"score_value","type":"number","count":0,"scripted":false,"indexed":true,"analyzed":false,"doc_values":true},' +
            '{"name":"stored","type":"date","count":0,"scripted":false,"indexed":true,"analyzed":false,"doc_values":true},' +
            '{"name":"_source","type":"_source","count":0,"scripted":false,"indexed":false,"analyzed":false,"doc_values":false},' +
            '{"name":"_id","type":"string","count":0,"scripted":false,"indexed":false,"analyzed":false,"doc_values":false},' +
            '{"name":"_type","type":"string","count":0,"scripted":false,"indexed":false,"analyzed":false,"doc_values":false},' +
            '{"name":"_score","type":"number","count":0,"scripted":false,"indexed":false,"analyzed":false,"doc_values":false}]'
        }, null, '      ');

        $scope.exampleObject;
        $http.get(CONSTANTS.PROXY + '/kibana/object/' + $scope.game._id).success(function (data) {
            $scope.exampleObject = data;
        });

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
            var index = JSON.parse(document.getElementById('exampleIndex').value);
            if (index) {
                $http.post(CONSTANTS.PROXY + '/kibana/templates/index/' + $scope.game._id, index).success(function (data) {
                    $timeout(function () {
                        $http.get(CONSTANTS.PROXY + '/kibana/templates/fields/' + $scope.game._id).success(function (data) {
                            $scope.dropfields = data;
                            $scope.selectedIndex = index.title;
                        }).error(function (data, status) {
                            console.error('Error on get /kibana/templates/fields/' + $scope.game._id + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });
                    }, 500);
                }).error(function (data, status) {
                    console.error('Error on post /kibana/templates/index/' + $scope.game._id + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            }
        };

        $scope.addIndexObject = function () {
            var object = JSON.parse(document.getElementById('exampleObject').value);
            if (object) {
                $http.post(CONSTANTS.PROXY + '/kibana/object/' + $scope.game._id, object).success(function (data) {
                    $.notify('<strong>Object saved successfully</strong>.', {
                        offset: { x: 10, y: 65 }
                    });
                }).error(function (data, status) {
                    $.notify('<strong>Error while saving object</strong>', {
                        offset: { x: 10, y: 65 },
                        type: 'danger'
                    });
                    console.error('Error on post /kibana/object/' + $scope.game._id + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            }
        };

        $scope.addTemplateVisualization = function () {
            var visualization = JSON.parse(document.getElementById('exampleVisualization').value);
            if (visualization) {
                $http.post(CONSTANTS.PROXY + '/kibana/templates/visualization/author/' + $scope.username, visualization)
                    .success(function (visualizationData) {
                        $timeout(function () {
                            $http.post(CONSTANTS.PROXY + '/kibana/visualization/game/' + visualizationData._id + '/' + visualization.title,
                                $scope.dataWithField).success(function () {
                                var body = JSON.parse(JSON.stringify($scope.dataWithField).split('.').join('(dot)'));
                                $http.post(CONSTANTS.PROXY + '/kibana/visualization/tuples/fields/game/' + $scope.game._id, body)
                                    .success(function (data) {

                                    }).error(function (data, status) {
                                    console.error('Error on post /kibana/visualization/tuples/fields/game/' + $scope.game._id + ' ' +
                                        JSON.stringify(data) + ', status: ' + status);
                                });
                            }).error(function (data, status) {
                                console.error('Error on post /kibana/visualization/game/' + $scope.game._id + '/' + visualizationData._id + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            });

                            $http.get(CONSTANTS.PROXY + '/kibana/templates/fields/' + visualizationData._id).success(function (data) {
                                var exist = false;
                                data.forEach(function (f) {
                                    $scope.visualizationFields.forEach(function (currentF) {
                                        if (currentF === f) {
                                            exist = true;
                                        }
                                    });
                                    if (!exist) {
                                        $scope.visualizationFields.push(f);
                                    }
                                });
                                $http.put(CONSTANTS.PROXY + '/kibana/visualization/list/' + $scope.game._id,
                                    {visualizationsDev: [visualizationData._id]}).success(function (data) {
                                    if ($scope.selectedVisualizationDevList.indexOf(visualizationData._id) === -1) {
                                        $scope.selectedVisualizationDevList.push(visualizationData._id);
                                    }
                                    var newVisualization = {id: visualizationData._id, title: visualization.title};
                                    if ($scope.visualizationList.indexOf(newVisualization) === -1) {
                                        $scope.visualizationList.push(newVisualization);
                                    }
                                    $scope.checkboxVisualizationsDev[visualizationData._id] = true;
                                }).error(function (data, status) {
                                    console.error('Error on post /kibana/visualization/list/' + $scope.game._id + ' ' +
                                        JSON.stringify(data) + ', status: ' + status);
                                });
                            }).error(function (data, status) {
                                console.error('Error on get /kibana/templates/fields' + visualizationData._id + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            });
                        }, 500);
                        $http.post(CONSTANTS.PROXY + '/kibana/visualization/game/' + $scope.game._id + '/' + visualizationData._id,
                            $scope.dataWithField).success(function () {

                        }).error(function (data, status) {
                            console.error('Error on post /kibana/visualization/game/' + $scope.game._id + '/' + visualizationData._id + ' ' +
                                JSON.stringify(data) + ', status: ' + status);
                        });
                    }).error(function (data, status) {
                    console.error('Error on post /kibana/templates/visualization/author/' + $scope.username + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            }
        };

        $scope.dashboardLink = '';

        $scope.generateTestVisualization = function () {
            var panels = [];
            var uiStates = {};

            // Add index
            $http.post(CONSTANTS.PROXY + '/kibana/index/' + $scope.game._id + '/' + $scope.testIndex, {})
                .success(function (data) {

                }).error(function (data, status) {
                console.error('Error on post /kibana/index/' + $scope.game._id + '/' + $scope.testIndex + ' ' +
                    JSON.stringify(data) + ', status: ' + status);
            });

            // Add dashboard
            var numPan = 1;
            var c = $scope.selectedVisualizationTchList.concat(
                $scope.selectedVisualizationDevList.filter(function (item) {
                    return $scope.selectedVisualizationTchList.indexOf(item) < 0;
                }));
            c.forEach(function (visualizationId) {
                $http.post(CONSTANTS.PROXY + '/kibana/visualization/activity/' + $scope.game._id + '/' + visualizationId + '/' + $scope.testIndex, {})
                    .success(function (data) {
                        panels.push('{\"id\":\"' + visualizationId + '_' + $scope.testIndex + '\",\"type\":\"visualization\",\"panelIndex\":' +
                            numPan + ',' + '\"size_x\":6,\"size_y\":4,\"col\":' + (1 + (numPan - 1 % 2)) + ',\"row\":' + (numPan + 1 / 2) + '}');
                        uiStates['P-' + numPan] = {vis: {legendOpen: false}};
                        numPan++;

                        if (numPan > c.length) {
                            // Add dashboard
                            var dashboard = {
                                title: 'dashboard_' + $scope.testIndex,
                                hits: 0,
                                description: '',
                                panelsJSON: '[' + panels.toString() + ']',
                                optionsJSON: '{"darkTheme":false}',
                                uiStateJSON: JSON.stringify(uiStates),
                                version: 1,
                                timeRestore: true,
                                timeTo: 'now',
                                timeFrom: 'now-7d',
                                refreshInterval: {
                                    display: '20 seconds',
                                    pause: false,
                                    section: 1,
                                    value: 5000
                                },
                                kibanaSavedObjectMeta: {
                                    searchSourceJSON: '{"filter":[{"query":{"query_string":{"query":"*","analyze_wildcard":true}}}]}'
                                }
                            };
                            $http.post(CONSTANTS.PROXY + '/kibana/dashboard/activity/' + $scope.testIndex, dashboard)
                                .success(function (data) {
                                    var url = CONSTANTS.KIBANA + '/app/kibana#/dashboard/dashboard_' +
                                        $scope.testIndex + '?embed=true_g=(refreshInterval:(display:\'5%20seconds\',' +
                                        'pause:!f,section:1,value:5000),time:(from:now-1h,mode:quick,to:now))';
                                    if (url.startsWith('localhost')) {
                                        url = 'http://' + url;
                                    }
                                    $scope.dashboardLink = $sce.trustAsResourceUrl(url);
                                    document.getElementById('dashboardIframe').contentWindow.location.reload();
                                }).error(function (data, status) {
                                console.error('Error on post /kibana/dashboard/activity/' + $scope.testIndex + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            });
                        }
                    }).error(function (data, status) {
                    console.error('Error on post /kibana/visualization/activity/' + $scope.game._id + '/' + visualizationId + '/' +
                        $scope.testIndex + ' ' + JSON.stringify(data) + ', status: ' + status);
                });
            });
        };

        $scope.visualizationTitleWithoutGameId = function (visualization) {
            var re = /_\d.*/;
            var m = re.exec(visualization);
            return visualization.replace(m[0], '');
        };

        // ------------------------------ //
        /*    END KIBANA VISUALIZATION    */
        // ------------------------------ //

        $scope.getTempleateVisualizations = function () {
            if ($scope.game && $scope.version) {

                $http.get(CONSTANTS.PROXY + '/kibana/templates/index/' + $scope.game._id)
                    .success(function (data) {
                        $scope.selectedIndex = data._source.title;
                    }).error(function (data, status) {
                });

                $scope.testIndex = $scope.game._id;
                $http.get(CONSTANTS.PROXY + '/kibana/templates/_default_')
                    .success(function (data) {
                        $scope.defaultList = data;
                    }).error(function (data, status) {
                    $scope.defaultList = [];
                });

                $http.get(CONSTANTS.PROXY + '/kibana/templates/' + $scope.username)
                    .success(function (data) {
                        $scope.visualizationList = data;
                    }).error(function (data, status) {
                    $scope.visualizationList = [];
                });

                $scope.selectedVisualizationDevList = [];
                $scope.selectedVisualizationTchList = [];
                $scope.visualizationFields = [];
                $scope.dropfields = [];

                $http.get(CONSTANTS.PROXY + '/kibana/visualization/list/dev/' + $scope.game._id)
                    .success(function (data) {
                        $scope.selectedVisualizationDevList = data;
                        data.forEach(function (visualization) {
                            $scope.checkboxVisualizationsDev[visualization] = true;
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

                                $http.get(CONSTANTS.PROXY + '/kibana/templates/fields/' + $scope.game._id).success(function (data) {
                                    $scope.dropfields = data;
                                    $scope.visualizationFields.forEach(function (fieldName) {
                                        if (data.indexOf(fieldName) !== -1) {
                                            $scope.currentSelectedField[fieldName] = fieldName;
                                        }
                                    });
                                }).error(function (data, status) {
                                    console.error('Error on get /kibana/templates/fields/' + $scope.game._id + ' ' +
                                        JSON.stringify(data) + ', status: ' + status);
                                });

                                $http.get(CONSTANTS.PROXY + '/kibana/visualization/tuples/fields/game/' + $scope.game._id).success(function (data) {
                                    $scope.currentSelectedField = JSON.parse(JSON.stringify(data).split('(dot)').join('.'));
                                }).error(function (data, status) {
                                    console.error('Error on get /kibana/visualization/tuples/fields/game/' + $scope.game._id + ' ' +
                                        JSON.stringify(data) + ', status: ' + status);
                                });
                            }).error(function (data, status) {
                                console.error('Error on get /kibana/templates/fields' + visualization + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            });
                        });
                    }).error(function (data, status) {
                    console.error('Error on get /kibana/visualization/list/' + $scope.game._id + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });

                $http.get(CONSTANTS.PROXY + '/kibana/visualization/list/tch/' + $scope.game._id)
                    .success(function (data) {
                        $scope.selectedVisualizationTchList = data;
                        data.forEach(function (visualization) {
                            $scope.checkboxVisualizationsTch[visualization] = true;
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

                                $http.get(CONSTANTS.PROXY + '/kibana/templates/fields/' + $scope.game._id).success(function (data) {
                                    $scope.dropfields = data;
                                    $scope.visualizationFields.forEach(function (fieldName) {
                                        if (data.indexOf(fieldName) !== -1) {
                                            $scope.currentSelectedField[fieldName] = fieldName;
                                        }
                                    });
                                }).error(function (data, status) {
                                    console.error('Error on get /kibana/templates/fields/' + $scope.game._id + ' ' +
                                        JSON.stringify(data) + ', status: ' + status);
                                });

                                $http.get(CONSTANTS.PROXY + '/kibana/visualization/tuples/fields/game/' + $scope.game._id).success(function (data) {
                                    $scope.currentSelectedField = JSON.parse(JSON.stringify(data).split('(dot)').join('.'));
                                }).error(function (data, status) {
                                    console.error('Error on get /kibana/visualization/tuples/fields/game/' + $scope.game._id + ' ' +
                                        JSON.stringify(data) + ', status: ' + status);
                                });
                            }).error(function (data, status) {
                                console.error('Error on get /kibana/templates/fields' + visualization + ' ' +
                                    JSON.stringify(data) + ', status: ' + status);
                            });
                        });
                    }).error(function (data, status) {
                    console.error('Error on get /kibana/visualization/list/' + $scope.game._id + ' ' +
                        JSON.stringify(data) + ', status: ' + status);
                });
            }
        };
    }
]);


