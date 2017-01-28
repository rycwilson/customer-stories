
function initGoogleCharts (asyncLoad, charts) {

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

  var drawVisitorsBarGraph = function (visitors) {
    var totalVisitors = 0, axesLabels = [], xDelta = null;

    visitors.forEach(function (group) { totalVisitors += group[1]; });

    // columns as days or weeks?
    if (visitors.length === 1) {   // 1 day
      xDelta = 0;
    } else if (visitors.length > 1) {
      xDelta = moment.duration(new Date(visitors[1][0]) - new Date(visitors[0][0])).asDays();
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
    if (visitors.length > 0) {
      visitors.unshift(axesLabels);
    }
    return function () {
      var data = google.visualization.arrayToDataTable(visitors),
          view = new google.visualization.DataView(data),
          options = {
            title: "Unique Visitors - " + totalVisitors.toString(),
          //   // width: 1000,
          //   // height: 400,
          //   // bar: { groupWidth: "95%" },
          //   legend: { position: "none" },
            hAxis: {
              title: axesLabels[0]
            },
            vAxis: { title: axesLabels[1], minValue: 0 },
            legend: { position: 'none' }
          },
          chart = new google.visualization.ColumnChart($('#visitors-bar-graph')[0]);
      chart.draw(view, options);
    };
  };

  var drawCharts = function (google) {
    // even if visitors is empty, the old visitors chart will stick around,
    // so just get rid of all charts
    $('#referrer-type-pie-chart').empty();
    $('#visitors-bar-graph').empty();
    google.charts.setOnLoadCallback(drawReferrerTypesPieChart(charts.referrerTypes));
    google.charts.setOnLoadCallback(drawVisitorsBarGraph(charts.visitors));
  };

  var loadCharts = function (google) {
    google.charts.load('current', { packages: ['corechart'] });
    if (asyncLoad === true) {
      drawCharts(google);
    } else if ($('#measure-panel').hasClass('active')) {
      $('#charts-filter-form').trigger('submit');
    }
  } ;

  if ($('body').hasClass('companies show') &&
      (typeof google === 'undefined' || typeof google.charts === 'undefined' )) {
    $.getScript('//www.gstatic.com/charts/loader.js', function () {
      loadCharts(google);
    });
  } else if ($('body').hasClass('companies show')) {
    loadCharts(google);
  }

}