'use strict';

angular.module('dataApp', ['myApp', 'ngStorage', 'services'])
    .controller('DataCtrl', ['$scope',
        function ($scope) {

            $scope.addWarning = function () {
                $scope.addToList('warnings', {
                    cond: 'false',
                    message: 'No message'
                });
            };

            $scope.addAlert = function () {
                $scope.addToList('alerts', {
                    expression: '0',
                    maxDiff: 0,
                    message: 'No message'
                });
            };

            $scope.addToList = function (list, object) {
                if ($scope.selectedVersion) {
                    if (!$scope.selectedVersion[list]) {
                        $scope.selectedVersion[list] = [];
                    }
                    $scope.selectedVersion[list].push(object);
                    $scope.selectedVersion.$save();
                }
            };

            $scope.deleteFromList = function (list, object) {
                var index = $scope.selectedVersion[list].indexOf(object);
                if (index > -1) {
                    $scope.selectedVersion[list].splice(index, 1);
                }
                $scope.selectedVersion.$save();
            };
        }
    ]);