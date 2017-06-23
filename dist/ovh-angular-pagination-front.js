angular.module("ovh-angular-pagination-front", ["ui.bootstrap"]);

angular.module("ovh-angular-pagination-front").directive("paginationFront",
["$q",

function ($q) {
    "use strict";

    return {
        restrict : "A",
        templateUrl : "ovh-angular-pagination-front.html",
        replace   : false,
        transclude: true,
        scope : {
            items                     : "=",
            fakeCurrentPage           : "=?currentPage",
            numPages                  : "=?nbPages",
            itemsPerPage              : "=",
            refresh                   : "=?",
            paginatedItems            : "=",
            pagePlaceholder           : "@",
            itemPerPagePlaceholder    : "@",
            onPageChange              : "&",
            transformItem             : "&?",
            onTransformItemGetPromise : "&",
            onTransformItemDone       : "&",
            onTransformItemNotify     : "&",
            goToPage                  : "@"
        },
        link : function ($scope) {

            if ($scope.fakeCurrentPage) {
                $scope.currentPage = $scope.fakeCurrentPage;

                $scope.$watch("fakeCurrentPage", function (page) {
                    if (page && page <= $scope.numPages) {
                        $scope.currentPage = page;
                    }
                });
            } else {
                $scope.currentPage = 1;
            }

            if (localStorage && localStorage.getItem("pagination_front_items_per_page")) {
                $scope.itemsPerPage = localStorage.getItem("pagination_front_items_per_page");
            } else {
                if (!$scope.itemsPerPage) {
                    $scope.itemsPerPage = 10;
                }
            }

            $scope.maxSize = 5;

            var doTransform = function (items) {
                var rejectedItem = {};
                var promise = $q.all(items.map(function (item) {
                    return $q.when($scope.transformItem({
                        item: item
                    })).then(function (transformed) {
                        $scope.onTransformItemNotify({ item : transformed });
                        return transformed;
                    })["catch"](function () {
                        return rejectedItem;
                    });
                })).then(function (items) {
                    items = items.filter(function (item) {
                        return item !== rejectedItem;
                    });
                    $scope.onTransformItemDone({ items : items });
                    return items;
                });
                $scope.onTransformItemGetPromise({ "promise" : promise });
                return promise;
            };

            var paginates = function () {

                if ($scope.arrayItems) {
                    $scope.paginatedItems = [];

                    var from = ($scope.currentPage - 1) * $scope.itemsPerPage;
                    var to = $scope.itemsPerPage * $scope.currentPage;
                    var itemsToLoad = [];

                    if (to > $scope.totalItems) {
                        to = $scope.totalItems;
                    }

                    if (from < 0) {
                        from = 0;
                    }

                    for (var i = from; i < to; i++) {
                        itemsToLoad.push(angular.copy($scope.arrayItems[i]));
                    }

                    if ($scope.transformItem) {
                        doTransform(itemsToLoad).then(function (transformatedItems) {
                            $scope.paginatedItems = transformatedItems;
                        });
                    } else {
                        $scope.paginatedItems = itemsToLoad;
                    }

                    $scope.onPageChange({ items : $scope.paginatedItems });
                }
            };

            var isInt = function (value) {
                return !isNaN(value) &&
                parseInt(Number(value), 10) === value &&
                !isNaN(parseInt(value, 10));
            };

            $scope.$watch("items", function (nv) {
                if (nv !== undefined) {
                    if (angular.isObject(nv) && !angular.isArray(nv)) {
                        $scope.arrayItems = _.toArray($scope.items);
                    } else {
                        $scope.arrayItems = $scope.items;
                    }
                    $scope.arrayItems = $scope.arrayItems || [];
                    $scope.totalItems = $scope.arrayItems.length;
                    paginates();
                }
            }, true);

            //Watch change page
            $scope.$watch("currentPage", function (page) {
                if (isInt(page)) {
                    paginates();
                    $scope.fakeCurrentPage = page;
                }
            });

            $scope.changePage = function () {
                if (parseInt($scope.goPage, 10)) {
                    if ($scope.goPage) {
                        if ($scope.goPage > $scope.numPages) {
                            $scope.currentPage = $scope.numPages;
                        }else {
                            $scope.currentPage = $scope.goPage;
                        }
                    }else {
                        $scope.currentPage = 1;
                    }
                }
            };

            $scope.changePageKeyPress = function ($event) {
                if ($event.keyCode === 13) {
                    $scope.goPage = null;
                }
            };

            //Watch number of items per page
            $scope.$watch("itemsPerPage", function (itemsPerPage) {
                if (itemsPerPage !== undefined) {
                    if (localStorage) {
                        localStorage.setItem("pagination_front_items_per_page", itemsPerPage);
                    }
                    paginates();
                }
            });

            $scope.$watch("refresh", function () {
                paginates();
            });

        }

    };

}]);

angular.module('ovh-angular-pagination-front').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('ovh-angular-pagination-front.html',
    "<div class=pagination-container><ul uib-pagination class=pagination-sm data-total-items=totalItems data-max-size=maxSize data-boundary-links=true data-rotate=false data-num-pages=numPages data-items-per-page=itemsPerPage data-ng-model=currentPage data-previous-text=&lsaquo; data-next-text=&rsaquo; data-first-text=&laquo; data-last-text=&raquo;></ul><input class=\"pagination-page-input pull-right\" data-ng-show=\"goToPage !== 'false'\" name=currentPageInput type=number min=1 data-ng-model=goPage data-ng-model-options=\"{ debounce: {'default': 500} }\" data-ng-change=changePage() data-ng-blur=\"goPage = null\" data-ng-keypress=changePageKeyPress($event); placeholder={{pagePlaceholder}}><select class=\"pagination-page-size pull-right\" data-ng-show=\"goToPage !== 'false'\" name=itemsPerPageSelect data-ng-model=itemsPerPage data-ng-options=\"size for size in [5, 10, 20, 40, 80, 100]\"><option value=\"\" disabled data-ng-bind=itemPerPagePlaceholder selected></option></select></div>"
  );

}]);