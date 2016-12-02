'use strict';

/**
 * @ngdoc function
 * @name sfDashApp.controller:NextbusCtrl
 * @description
 * # NextbusCtrl
 * Controller of the sfDashApp
 */
angular.module('sfDashApp')
  .controller('NextbusCtrl', function ($scope, $interval, $localStorage, nextBusSvc, WARNING_AFTER_N_MISSED_CALLS) {

    $localStorage.stopRouteTags = $localStorage.stopRouteTags  || [];

    $scope.callInterval = 10 * 1000;
    $scope.msUntilWarning = $scope.callInterval * WARNING_AFTER_N_MISSED_CALLS;

    $scope.nextBus = {
      predictions: [],
      toggleBusRemove: function () {
        this.showBusRemoval = !this.showBusRemoval;
      },
      removeStopRoute: function (prediction) {
        var routeStopPair = prediction._routeTag + '|' + prediction._stopTag;
        var idx = $localStorage.stopRouteTags.indexOf(routeStopPair);
        $localStorage.stopRouteTags.splice(idx, 1);
        updatePredictions();
      },
      addForm : {
        toggleBusAddForm: function () {
          if (this.showBusAddForm === true) {
            this.resetForm();
          }
          this.showBusAddForm = !this.showBusAddForm;
        },
        getNearbyStops: function () {
          var that = this;
          this.loading = true;
          nextBusSvc.getStopsWithin(this.distance)
            .then(function (stops) {
              that.nearbyStops = stops;
              that.errMsg = undefined;
            }, function (err) {
              if (typeof err !== 'string'){
                err = JSON.stringify(err);
              }
              that.errMsg = err;
            }).finally(function () {
            that.loading = false;
          });
        },
        validate: function () {
          var routeStopPair = this.routeTag + '|' + this.stopTag;
          var that = this;
          nextBusSvc.getPredictions([routeStopPair])
            .then(function () {
              this.addStop(routeStopPair);
            }, function () {
              that.validStop = false;
            });
        },
        addStop: function (routeStopPair) {
          $localStorage.stopRouteTags.push(routeStopPair);
          updatePredictions();
          this.resetForm();
        },
        resetForm: function () {
          this.distance = this.routeTag = this.stopTag = this.validStop =
            this.nearbyStops = this.loading = undefined;
        }
      }
    };

    var updatePredictions = function () {
      // Don't send an empty request
      if (!$localStorage.stopRouteTags.length) {return;}

      nextBusSvc.getPredictions($localStorage.stopRouteTags)
        .then(function (predictions) {
          $scope.nextBus.predictions = predictions;
          $scope.nextBus._lastUpdated = moment();
        });
    };
    updatePredictions();
    $scope.intervals.push(
      $interval(updatePredictions, $scope.callInterval)
    );

  });
