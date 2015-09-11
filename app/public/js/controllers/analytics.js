'use strict';

angular.module('analyticsApp', ['myApp', 'ngStorage', 'services'])
    .controller('AnalyticsCtrl', ['$scope', '$http', '$timeout', 'CONSTANTS',
        function ($scope, $http, $timeout, CONSTANTS) {

            $scope.getStatements = function () {
                $http.get(CONSTANTS.PROXY + '/games/statements').success(function (data) {

                    var dash = new ADL.XAPIDashboard();
                    dash.addStatements(data.statements);

                    var header = document.querySelector('#headerVerbs');
                    header.innerHTML = 'Verb Popularity';
                    var verbsChart = dash.createBarChart({
                        container: '#verbs svg',
                        groupBy: 'verb.id',
                        aggregate: ADL.count(),
                        post: function (data) {
                            data.orderBy('out', 'descending').slice(0, 10);
                        },
                        customize: function (nvd3chart) {
                            nvd3chart.margin({bottom: 150, right: 50});
                            nvd3chart.xAxis.rotateLabels(45);
                            nvd3chart.xAxis.tickFormat(function (label) {
                                return /[^\/]+$/.exec(label)[0];
                            });
                        }
                    });
                    verbsChart.draw();

                    header = document.querySelector('#headerActivity');
                    header.innerHTML = 'Top ten user activity';
                    var actorChart = dash.createBarChart({
                        container: '#actorActivity svg',
                        groupBy: 'actor.name',
                        aggregate: ADL.count(),
                        post: function (data) {
                            data.orderBy('out', 'descending').slice(0, 10);
                        },
                        customize: function (nvd3chart) {
                            nvd3chart.xAxis.rotateLabels(45);
                            nvd3chart.xAxis.tickFormat(function (label) {
                                return /[^\/]+$/.exec(label)[0];
                            });
                            nvd3chart.margin({bottom: 150, right: 50});
                        }
                    });
                    actorChart.draw();

                    header = document.querySelector('#headerLrsYear');
                    header.innerHTML = 'LRS Activity Over Last Year';
                    var year = 31556926000;
                    var activityChart = dash.createLineChart({
                        container: '#lrsActivityLastYear svg',
                        groupBy: 'stored',
                        range: {
                            start: (new Date(Date.now() - year)).toISOString(),
                            end: (new Date(Date.now())).toISOString(),
                            increment: 1000 * 3600 * 24
                        },
                        rangeLabel: 'start',
                        aggregate: ADL.count(),
                        post: function (data) {
                            data.contents.map(function (el) {
                                el.in = Date.parse(el.in);
                            });
                        },
                        customize: function (nvd3chart) {
                            nvd3chart.xAxis.tickFormat(function (label) {
                                return d3.time.format('%b %d')(new Date(label));
                            });
                        }
                    });
                    activityChart.draw();

                    header = document.querySelector('#headerLrsWeek');
                    header.innerHTML = 'LRS Activity Over Last Week';
                    var week = 604800000;
                    var activity2Chart = dash.createLineChart({
                        container: '#lrsActivityLastWeek svg',
                        groupBy: 'stored',
                        range: {
                            start: (new Date(Date.now() - week)).toISOString(),
                            end: (new Date(Date.now())).toISOString(),
                            increment: 1000 * 3600 * 24
                        },
                        rangeLabel: 'start',
                        aggregate: ADL.count(),
                        post: function (data) {
                            data.contents.map(function (el) {
                                el.in = Date.parse(el.in);
                            });
                        },
                        customize: function (nvd3chart) {
                            nvd3chart.xAxis.tickFormat(function (label) {
                                return d3.time.format('%b %d')(new Date(label));
                            });
                        }
                    });
                    activity2Chart.draw();

                    header = document.querySelector('#headerScore');
                    header.innerHTML = 'Top ten user score';
                    var scoreChart = dash.createBarChart({
                        container: '#actorScore svg',
                        where: 'object.definition.extensions.target==="score"',
                        groupBy: 'actor.name',
                        aggregate: ADL.max('object.definition.extensions.value'),
                        post: function (data) {
                            data.orderBy('out', 'descending').slice(0, 10);
                        },
                        customize: function (nvd3chart) {
                            nvd3chart.xAxis.rotateLabels(45);
                            nvd3chart.xAxis.tickFormat(function (label) {
                                return /[^\/]+$/.exec(label)[0];
                            });
                            nvd3chart.margin({right: 80, bottom: 150});
                        }
                    });
                    scoreChart.draw();

                }).error(function (data, status) {
                    console.error('Error on get /games/statements', data, ', status: ', status);
                });
            };

        }
    ]);