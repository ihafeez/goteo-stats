(function() {
  'use strict';

  var app = angular.module('goteoStatistics');

  app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/money/:locale/:year/:category/:node/:call', {
      templateUrl: 'views/money.html',
      controller: 'MoneyCtrl',
      dependencies: [ 'locale', 'year', 'category', 'node', 'call' ],
      resolve: {
        categories: [
          'GoteoApi', function(GoteoApi) {
            return GoteoApi.getCategories();
          }
        ],
        nodes: [
          'GoteoApi', function(GoteoApi) {
            return GoteoApi.getNodes();
          }
        ],
        calls: [
          'GoteoApi', function(GoteoApi) {
            return GoteoApi.getCalls();
          }
        ],
        moneyData: [
          '$route',
          'GoteoApi', function($route, GoteoApi) {
            var year = parseInt($route.current.params.year),
              category = parseInt($route.current.params.category),
              node = $route.current.params.node,
              call = $route.current.params.call,
              locale = $route.current.params.locale;
            return GoteoApi.getData('money', locale, year, category, node, call);
          }
        ]
      }
    });
  }]);

  /**
   * `/money` controller
   */
  app.controller('MoneyCtrl', [
    '$timeout',
    '$translate',
    '$scope',
    '$rootScope',
    '$routeParams',
    'categories',
    'nodes',
    'calls',
    'moneyData',
    function ($timeout, $translate, $scope, $rootScope, $routeParams, categories, nodes, calls, moneyData) {
      $rootScope.categories = categories;
      $rootScope.nodes = nodes;
      $rootScope.calls = calls;
      $rootScope.year = $routeParams.year;
      $rootScope.category = $routeParams.category;
      $rootScope.node = $routeParams.node;
      $rootScope.call = $routeParams.call;
      $rootScope.locale = $routeParams.locale;

      /**
       * Process data to be used in charts.
       */
      $scope.prepareData = function() {
        var temp, datum;
        $scope.data = {};

        $scope.data.averageDonation = {
          year: moneyData.global['average-donation'],
          months: []
        };
        $scope.data.averageDonationPaypal = {
          year: moneyData.global['average-donation-paypal'],
          months: []
        };
        $scope.data.averageFailed = {
          year: moneyData.global['average-failed'],
          months: []
        };
        $scope.data.averageMinimum = {
          year: moneyData.global['average-minimum'],
          months: []
        };
        $scope.data.averageReceived = {
          year: moneyData.global['average-received'],
          months: []
        };
        $scope.data.averageSecondRound = {
          year: moneyData.global['average-second-round'],
          months: []
        };
        $scope.data.pledged = {
          year: moneyData.global.pledged,
          months: []
        };
        $scope.data.pledgedFailed = {
          year: moneyData.global['percentage-pledged-failed'],
          months: []
        };
        $scope.data.pledgedSuccessful = {
          year: moneyData.global['percentage-pledged-successful'],
          months: []
        };
        $scope.data.refunded = {
          year: moneyData.global.refunded,
          months: []
        };
        $scope.data.amount = [];
        temp = moneyData.global['cash-amount'] + moneyData.global['creditcard-amount'] +
          moneyData.global['matchfund-amount'] + moneyData.global['paypal-amount'];
        datum = {select: $rootScope.year, data: []};
        if (moneyData.global['cash-amount'] > 0) {
          datum.data.push({label: $translate.instant('money.sections.amount.labels.cash'), id: 'cash', value: moneyData.global['cash-amount'] / temp});
        }
        if (moneyData.global['creditcard-amount'] > 0) {
          datum.data.push({label: $translate.instant('money.sections.amount.labels.creditcard'), id: 'creditcard', value: moneyData.global['creditcard-amount'] / temp});
        }
        if (moneyData.global['matchfund-amount'] > 0) {
          datum.data.push({label: $translate.instant('money.sections.amount.labels.matchfund'), id: 'matchfund', value: moneyData.global['matchfund-amount'] / temp});
        }
        if (moneyData.global['paypal-amount'] > 0) {
          datum.data.push({label: $translate.instant('money.sections.amount.labels.paypal'), id: 'paypal', value: moneyData.global['paypal-amount'] / temp});
        }
        $scope.data.amount.push(datum);
        moment.locale($rootScope.locale);
        var months = moment.months();
        var min = 1;
        var max = 13;
        if(parseInt($rootScope.year, 10) === 0) {
          min = parseInt($rootScope.years[0], 10);
          max = parseInt($rootScope.years[$rootScope.years.length - 1], 10);
        }
        for(var i = min; i < max; i++) {
          if(i < 14) {
            var k = months[i-1] + ' ' + $rootScope.year;
            var currentData = moneyData.buckets[i.pad()];
          }
          else {
            var k = i;
            var currentData = moneyData.buckets[i];
          }
          if (currentData) {
            temp = currentData['cash-amount'] + currentData['creditcard-amount'] + currentData['fee-amount'] +
            currentData['matchfund-amount'] + currentData['matchfundpledge-amount'] + currentData['paypal-amount'];
            datum = {select: k, data: []};
            if (currentData['cash-amount'] > 0) {
              datum.data.push({
                label: $translate.instant('money.sections.amount.labels.cash'),
                id: 'cash',
                value: currentData['cash-amount'] / temp
              });
            }
            if (currentData['creditcard-amount'] > 0) {
              datum.data.push({
                label: $translate.instant('money.sections.amount.labels.creditcard'),
                id: 'creditcard',
                value: currentData['creditcard-amount'] / temp
              });
            }
            if (currentData['matchfund-amount'] > 0) {
              datum.data.push({
                label: $translate.instant('money.sections.amount.labels.matchfund'),
                id: 'matchfund',
                value: currentData['matchfund-amount'] / temp
              });
            }
            if (currentData['paypal-amount'] > 0) {
              datum.data.push({
                label: $translate.instant('money.sections.amount.labels.paypal'),
                id: 'paypal',
                value: currentData['paypal-amount'] / temp
              });
            }
            $scope.data.amount.push(datum);
            $scope.data.averageDonation.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: currentData['average-donation']
            });
            $scope.data.averageDonationPaypal.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: currentData['average-donation-paypal']
            });
            $scope.data.averageFailed.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: currentData['average-failed']
            });
            $scope.data.averageMinimum.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: currentData['average-minimum']
            });
            $scope.data.averageReceived.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: currentData['average-received']
            });
            $scope.data.averageSecondRound.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: currentData['average-second-round']
            });
            $scope.data.pledged.months.push({id: k, name: $rootScope.getDate(i), value: currentData.pledged});
            $scope.data.pledgedFailed.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: currentData['percentage-pledged-failed']
            });
            $scope.data.pledgedSuccessful.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: currentData['percentage-pledged-successful']
            });
            $scope.data.refunded.months.push({id: k, name: $rootScope.getDate(i), value: currentData.refunded});
          } else {
            // NOTE: in order to avoid downhills when next month doesn't have data, we add a fake dot in the last month
            // with data.
            if (i > 1) {
              var previousData = moneyData.buckets[(i-1).pad()];
              if (previousData) {
                var prevK = 'FAKE';
                $scope.data.pledged.months.push({id: prevK, name: $rootScope.getDate(i-1), value: 0});
                $scope.data.averageDonation.months.push({id: prevK, name: $rootScope.getDate(i-1), value: 0});
                $scope.data.averageReceived.months.push({id: prevK, name: $rootScope.getDate(i-1), value: 0});
              }
            }
            $scope.data.averageDonation.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: 0,
              noAvailable: true
            });
            $scope.data.averageDonationPaypal.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: 0,
              noAvailable: true
            });
            $scope.data.averageFailed.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: 0,
              noAvailable: true
            });
            $scope.data.averageMinimum.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: 0,
              noAvailable: true
            });
            $scope.data.averageReceived.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: 0,
              noAvailable: true
            });
            $scope.data.averageSecondRound.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: 0,
              noAvailable: true
            });
            $scope.data.pledged.months.push({id: k, name: $rootScope.getDate(i), value: 0, noAvailable: true});
            $scope.data.pledgedFailed.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: 0,
              noAvailable: true
            });
            $scope.data.pledgedSuccessful.months.push({
              id: k,
              name: $rootScope.getDate(i),
              value: 0,
              noAvailable: true
            });
            $scope.data.refunded.months.push({id: k, name: $rootScope.getDate(i), value: 0, noAvailable: true});
          }
        }
      };
      $scope.prepareData();
      $timeout(function() {
        $('#money-container').isotope({
          itemSelector : '.card'
        });
        //hack if the user is comming for the first time into this controller
        $('#categorySelector').val($rootScope.category);
        $('#nodeSelector').val($rootScope.node);
        $('#callSelector').val($rootScope.call);

      }, 1000);
  }]);
}).call(this);