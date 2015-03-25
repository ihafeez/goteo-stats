(function() {
  'use strict';

  var app = angular.module('goteoStatistics');

  app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/rewards/:locale/:year/:category', {
      templateUrl: 'views/rewards.html',
      controller: 'RewardsCtrl',
      dependencies: [ 'locale', 'year', 'category' ],
      resolve: {
        categories: [
          'GoteoApi', function(GoteoApi) {
            return GoteoApi.getCategories();
          }
        ],
        rewardsData: [
          '$route',
          'GoteoApi', function($route, GoteoApi) {
            var year = parseInt($route.current.params.year),
              category = parseInt($route.current.params.category),
              locale = $route.current.params.locale;
            return GoteoApi.getData('rewards', locale, year, category);
          }
        ],
        licensesData: [
          '$route',
          'GoteoApi', function($route, GoteoApi) {
            var year = parseInt($route.current.params.year),
              category = parseInt($route.current.params.category),
              locale = $route.current.params.locale;
            return GoteoApi.getData('licenses', locale, year, category);
          }
        ]
      }
    });
  }]);

  /**
   * `/rewards` controller
   */
  app.controller('RewardsCtrl', [
    '$timeout',
    '$translate',
    '$scope',
    '$rootScope',
    '$routeParams',
    'categories',
    'rewardsData',
    'licensesData',
    function ($timeout, $translate, $scope, $rootScope, $routeParams, categories, rewardsData, licensesData) {
      $rootScope.categories = categories;
      $rootScope.year = $routeParams.year;
      $rootScope.category = $routeParams.category;
      $rootScope.locale = $routeParams.locale;

      /**
       * Process data to be used in charts.
       */
      $scope.prepareData = function() {
        var temp, datum;
        $scope.data = {};
        $scope.data.licenses = [];
        temp = 0;
        for (var i = 0; i < licensesData.global.items.length; i++) {
          temp += licensesData.global.items[i]['total-projects'];
        }
        for (var i = 0; i < licensesData.global.items.length; i++) {
          licensesData.global.items[i].total = (licensesData.global.items[i]['total-projects'] / temp) * 100;
        }
        $scope.data.licenses = licensesData.global.items.sort(function(a, b) {
          return b.total - a.total;
        });
        $scope.data.favoriteRewards = [];
        $scope.data.rewardsPerAmount = [];
        $scope.data.rewardRefusal = {
          year: rewardsData.global['reward-refusal'],
          months: []
        };
        $scope.data.percentageRewardRefusal = {
          year: rewardsData.global['percentage-reward-refusal'],
          months: []
        };
        temp = 0;
        for (i = 0; i < rewardsData.global['favorite-rewards'].length; i++) {
          temp += rewardsData.global['favorite-rewards'][i].total;
        }
        for (i = 0; i < rewardsData.global['favorite-rewards'].length; i++) {
          rewardsData.global['favorite-rewards'][i].total = rewardsData.global['favorite-rewards'][i].total / temp;
          rewardsData.global['favorite-rewards'][i].label = rewardsData.global['favorite-rewards'][i].name;
        }
        $scope.data.favoriteRewards.push({
          select: $rootScope.year,
          data: rewardsData.global['favorite-rewards']
        });
        temp = Object.keys(rewardsData.global['rewards-per-amount']).map(function(d) {
          return rewardsData.global['rewards-per-amount'][d];
        }).reduce(function(previousValue, currentValue) {
          return previousValue + currentValue;
        });
        datum = Object.keys(rewardsData.global['rewards-per-amount']).map(function(d) {
          return {id: d,
                  name: $translate.instant('rewards.sections.rewards-per-amount.labels.' + d),
                  value: rewardsData.global['rewards-per-amount'][d] / temp}
        });
        $scope.data.rewardsPerAmount.push({
          select: $rootScope.year,
          data: datum
        });
        moment.locale($rootScope.locale);
        var months = moment.months();
        for(var i = 1; i < 13; i++) {
          var k = months[i - 1] + ' ' + $rootScope.year;
          var currentData = rewardsData.buckets[i.pad()];
          if (currentData) {
            temp = 0;
            for (var n = 0; n < currentData['favorite-rewards'].length; n++) {
              temp += currentData['favorite-rewards'][n].total;
            }
            for (var n = 0; n < currentData['favorite-rewards'].length; n++) {
              currentData['favorite-rewards'][n].total = currentData['favorite-rewards'][n].total / temp;
              currentData['favorite-rewards'][n].label = currentData['favorite-rewards'][n].name;
            }
            $scope.data.favoriteRewards.push({ select: k, data: currentData['favorite-rewards']});
            temp = Object.keys(currentData['rewards-per-amount']).map(function(d) {
              return currentData['rewards-per-amount'][d];
            }).reduce(function(previousValue, currentValue) {
              return previousValue + currentValue;
            });
            datum = Object.keys(currentData['rewards-per-amount']).map(function(d) {
              return {id: d,
                name: $translate.instant('rewards.sections.rewards-per-amount.labels.' + d),
                value: currentData['rewards-per-amount'][d] / temp}
            });
            $scope.data.rewardsPerAmount.push({ select: k, data: datum });
            $scope.data.rewardRefusal.months.push({id: k, name: $rootScope.getDate(i), value: currentData['reward-refusal']});
            $scope.data.percentageRewardRefusal.months.push({id: k, name: $rootScope.getDate(i), value: currentData['percentage-reward-refusal']});
          } else {
            // NOTE: in order to avoid downhills when next month doesn't have data, we add a fake dot in the last month
            // with data.
            if (i > 1) {
              var previousData = rewardsData.buckets[(i-1).pad()];
              if (previousData) {
                var prevK = 'FAKE';
                $scope.data.percentageRewardRefusal.months.push({id: prevK, name: $rootScope.getDate(i-1), value: 0});
              }
            }
            $scope.data.rewardRefusal.months.push({id: k, name: $rootScope.getDate(i), value: 0});
            $scope.data.percentageRewardRefusal.months.push({id: k, name: $rootScope.getDate(i), value: 0});
          }
        }
      };
      $scope.prepareData();
      $timeout(function() {
        $('#rewards-container').isotope({
          itemSelector : '.card'
        });
      }, 1000);
  }]);
}).call(this);