'use strict';

angular.module('sessionApp', ['myApp', 'ngStorage', 'services'])
    .config(['$locationProvider',
        function ($locationProvider) {
            $locationProvider.html5Mode(false);
        }
    ])
    .directive('reports', function () {
        return function (scope, element, attrs) {
            new RadialProgress(angular.element(element).children(".progress-marker")[0], scope.result.progress);
            new ColumnProgress(angular.element(element).children(".score-marker")[0], scope.result.score);
        };
    })
    .controller('SessionCtrl', ['$scope', '$location', 'SessionsId', 'Results', 'Versions', 'QueryParams',
        function ($scope, $location, SessionsId, Results, Versions, QueryParams) {

            $scope.refreshResults = function () {
                var rawResults = Results.query({
                        id: $scope.session._id
                    },
                    function () {
                        calculateResults(rawResults);
                    });
            };

            $scope.session = SessionsId.get({
                id: QueryParams.getQueryParam('session')
            }, function () {
                $scope.version = Versions.get({
                    gameId: $scope.session.gameId,
                    versionId: $scope.session.versionId
                }, function () {
                    $scope.refreshResults();
                    if (!$scope.session.end) {
                        setInterval(function () {
                            $scope.refreshResults();
                        }, 10000);
                    }
                });
            });

            var evalExpression = function (expression, defaultValue) {
                try {
                    return eval(expression) || defaultValue;
                } catch (err) {
                    return defaultValue;
                }
            };


            var calculateResults = function (rawResults) {
                var results = [];
                var agg = {
                    score: [],
                    progress: [],
                    warnings: [],
                    alerts: []
                };

                $scope.agg = {
                    score: 0,
                    progress: 0,
                    alerts: [],
                    warnings: []
                };
                rawResults.forEach(function (result) {
                    result.name = evalExpression.call(result, $scope.version.alias, "Unknown");

                    result.score = Math.min(1, evalExpression.call(result, $scope.version.score, 0) / $scope.version.maxScore);

                    var progress = evalExpression.call(result, $scope.version.progress, 0);
                    result.progress = Math.min(1, progress);
                    result.warnings = [];
                    for (var i = 0; $scope.version.warnings && i < $scope.version.warnings.length; i++) {
                        var warning = $scope.version.warnings[i];
                        if (evalExpression.call(result, warning.cond, false)) {
                            result.warnings.push(i);
                            var aggWarning = agg.warnings[i] || {
                                    id: i,
                                    message: warning.message,
                                    count: 0
                                };

                            agg.warnings[i] = aggWarning;
                            aggWarning.count++;
                        }
                    }

                    result.alerts = [];
                    for (i = 0; $scope.version.alerts && i < $scope.version.alerts.length; i++) {
                        var alert = $scope.version.alerts[i];
                        var level = evalExpression.call(result, alert.value, 0);
                        if (level - ((result.levels && result.levels[i]) || 0 ) >= alert.maxDiff) {
                            result.alerts.push({
                                id: i,
                                level: level
                            });

                            var aggAlert = agg.alerts[i] || {
                                    id: i,
                                    message: alert.message,
                                    count: 0
                                };

                            agg.alerts[i] = aggAlert;
                            aggAlert.count++;
                        }
                    }
                    results.push(result);

                    if ($scope.player && $scope.player._id === result._id) {
                        $scope.player = result;
                    }

                    agg.score.push(result.score);
                    agg.progress.push(result.progress);
                });

                agg.alerts.forEach(function (alert) {
                    if(alert) {
                        $scope.agg.alerts.push(alert);
                    }
                });

                agg.warnings.forEach(function (warning) {
                    if(warning) {
                        $scope.agg.warnings.push(warning);
                    }
                });

                new gauss.Vector(agg.score).median(function (median) {
                    $scope.agg.score = median;
                });

                new gauss.Vector(agg.progress).median(function (median) {
                    $scope.agg.progress = median;
                });

                $scope.results = results;
            };

            if (!$scope.agg) {
                $scope.agg = {
                    score: 0,
                    progress: 0,
                    alerts: [],
                    warnings: []
                };
            }

            var progressUI = new RadialProgress("#progress");

            $scope.$watch('agg.progress', function () {
                progressUI.setProgress($scope.agg.progress || 0);
            });

            var scoreUI = new ColumnProgress("#score");

            $scope.$watch('agg.score', function () {
                scoreUI.setProgress($scope.agg.score || 0);
            });

            $scope.alertScore = function (result) {
                return result.alerts.length * 100 + result.warnings.length - result.score * 10;
            };

            var progressPlayer = new RadialProgress("#progress-player");
            var scorePlayer = new ColumnProgress("#score-player");

            $scope.viewPlayer = function (result) {
                progressPlayer.setProgress(result.progress || 0);
                scorePlayer.setProgress(result.score || 0);
                $scope.player = result;
            };

            $scope.updateLevels = function (player) {
                var levels = player.levels || [];

                player.alerts.forEach(function (alert) {
                    levels[alert.id] = alert.level;
                });
                delete player.alerts;
                player.levels = levels;
                player.$save({id: $scope.session._id}, function () {
                    $scope.player = null;
                    $scope.refreshResults();
                });
            };
        }
    ]);