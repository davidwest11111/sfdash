import angular from 'angular';
import moment from 'moment';
import 'moment-precise-range-plugin';


angular.module('sfDashApp').directive(
  'timeSinceLastUpdated',
  ['$interval', $interval => ({
    replace: true,
    restrict: 'EA',
    scope: {
      lastUpdated: '=',
      msUntilWarning: '=',
    },
    link: function postLink(scope, element) {
      element.addClass('time-since-last-updated');

      let timeText;

      const interval = $interval(() => {
        if (!scope.lastUpdated) { return; }

        timeText = scope.lastUpdated.preciseDiff(moment());
        if (!timeText) { // timeText is empty if diff is 0
          element.text('Just now.');
        } else {
          if (moment().diff(scope.lastUpdated) > scope.msUntilWarning) {
            element.addClass('overdue');
          } else {
            element.removeClass('overdue');
          }
          element.text(`${timeText} ago.`);
        }
      }, 1000);

      scope.$on('$destroy', () => {
        if (interval) {
          $interval.cancel(interval);
        }
      });
    },
  })],
);
