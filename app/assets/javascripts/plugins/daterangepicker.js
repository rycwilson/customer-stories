
function initDateRangePicker () {

  var start = moment().subtract(29, 'days'),
      end = moment(),
      month = moment().month(),
      year = moment().year(),
      quarterRange = function (thisOrLast) {
        if (month >= 0 && month < 3) {
          if (thisOrLast === 'this') {
            return [moment([year,0]), moment([year,2]).endOf('month')];
          } else {
            return [moment([year-1,9]), moment([year-1,11]).endOf('month')];
          }
        } else if (month >= 3 && month < 6) {
          if (thisOrLast === 'this') {
            return [moment([year,3]), moment([year,5]).endOf('month')];
          } else {
            return [moment([year,0]), moment([year,2]).endOf('month')];
          }
        } else if (month >= 6 && month < 9) {
          if (thisOrLast === 'this') {
            return [moment([year,6]), moment([year,8]).endOf('month')];
          } else {
            return [moment([year,3]), moment([year,5]).endOf('month')];
          }
        } else if (month >= 9 && month < 12) {
          if (thisOrLast === 'this') {
            return [moment([year,9]), moment([year,11]).endOf('month')];
          } else {
            return [moment([year,6]), moment([year,8]).endOf('month')];
          }
        }
      };

  // function cb (start, end) {
  //   $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
  // }

  $('input.daterange').daterangepicker({
    startDate: start,
    endDate: end,
    ranges: {
      'Last 7 Days': [moment().subtract(6, 'days'), moment()],
      'Last 30 Days': [moment().subtract(29, 'days'), moment()],
      'Last 90 Days': [moment().subtract(89, 'days'), moment()],
      'This Quarter': quarterRange('this'),
      'Last Quarter': quarterRange('last'),
      'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')]
    }

  });

}