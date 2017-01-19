
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

  var drawVisitorsBarGraph = function (uniqueVisitors) {
    var totalVisitors = 0, axesLabels = [];

    uniqueVisitors.forEach(function (group) { totalVisitors += group[1]; });

    // columns as days or weeks?
    if (uniqueVisitors.length === 1) {   // 1 day
      xDelta = 0;
    } else if (uniqueVisitors.length > 1) {
      xDelta = moment.duration(new Date(uniqueVisitors[1][0]) - new Date(uniqueVisitors[0][0])).asDays();
      if (xDelta < 0) { xDelta += 365; }  // account for ranges that span new year
    }
    if (xDelta <= 1)  {
      axesLabels = ['Day', 'Visitors'];
    } else if (xDelta === 7) {
      axesLabels = ['Week starting', 'Visitors'];
    } else {
      axesLabels = ['Month', 'Visitors'];
    }
    // don't bother if there is no data
    if (uniqueVisitors.length > 0) {
      uniqueVisitors.unshift(axesLabels);
    }
    return function () {
      var data = google.visualization.arrayToDataTable(uniqueVisitors),
          view = new google.visualization.DataView(data),
          options = {
            title: "Total Unique Visitors - " + totalVisitors.toString(),
          //   // width: 1000,
          //   // height: 400,
          //   // bar: { groupWidth: "95%" },
          //   legend: { position: "none" },
            hAxis: {
              title: axesLabels[0]
            },
            vAxis: { title: axesLabels[1] },
            legend: { position: 'none' }
          },
          chart = new google.visualization.ColumnChart($('#visitors-bar-graph')[0]);
      chart.draw(view, options);
    };
  };

  var drawCharts = function (google) {
    // even if uniqueVisitors is empty, the old visitors chart will stick around,
    // so just get rid of all charts
    $('#referrer-type-pie-chart').empty();
    $('#visitors-bar-graph').empty();
    google.charts.setOnLoadCallback(drawReferrerTypesPieChart(charts.referrerTypes));
    google.charts.setOnLoadCallback(drawVisitorsBarGraph(charts.uniqueVisitors));
  };

  if (syncLoad) {
    if ($('body').hasClass('companies show') &&
        (typeof google === 'undefined' || typeof google.charts === 'undefined' )) {

      $.getScript('//www.gstatic.com/charts/loader.js', function () {
        google.charts.load('current', { packages: ['corechart'] });
        drawCharts(google);
      });

    } else if ($('body').hasClass('companies show')) {
      google.charts.load('current', { packages: ['corechart'] });
      drawCharts(google);
    }
  } else {
    drawCharts(google);
  }

}