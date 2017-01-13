
function initGoogleCharts (syncLoad, charts) {

  var drawReferrerTypesPieChart = function (referrerTypes) {
    return function () {
      // Define the chart to be drawn.
      var data = new google.visualization.DataTable();

      data.addColumn('string', 'Referrer type');
      data.addColumn('number', 'Views');
      data.addRows(referrerTypes);

      // Instantiate and draw the chart.
      var chart = new google.visualization.PieChart($('#referrer-type-pie-chart')[0]);
      chart.draw(data, null);
    };
  };

  if (syncLoad) {

    if ($('body').hasClass('companies show') &&
        (typeof google === 'undefined' || typeof google.charts === 'undefined' )) {

      $.getScript('//www.gstatic.com/charts/loader.js', function () {
        google.charts.load('current', { packages: ['corechart'] });
        google.charts.setOnLoadCallback(drawReferrerTypesPieChart(charts.referrerTypes));
      });

    } else if ($('body').hasClass('companies show')) {
      google.charts.load('current', { packages: ['corechart'] });
      google.charts.setOnLoadCallback(drawReferrerTypesPieChart(charts.referrerTypes));
    }

  } else {

    google.charts.setOnLoadCallback(drawReferrerTypesPieChart(charts.referrerTypes));

  }

}