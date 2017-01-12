
function initGoogleCharts () {

  var drawReferrerTypePieChart = function () {
    // Define the chart to be drawn.
    var data = new google.visualization.DataTable(),
        referrer_types = gon.referrer_types;

    data.addColumn('string', 'Referrer type');
    data.addColumn('number', 'Views');
    data.addRows(referrer_types);

    // Instantiate and draw the chart.
    var chart = new google.visualization.PieChart($('#referrer-type-pie-chart')[0]);
    chart.draw(data, null);
  };

  if ($('body').hasClass('companies show') &&
      (typeof google === 'undefined' || typeof google.charts === 'undefined' )) {

    $.getScript('//www.gstatic.com/charts/loader.js', function () {
      google.charts.load('current', { packages: ['corechart'] });
      google.charts.setOnLoadCallback(drawReferrerTypePieChart);
    });

  } else {
    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(drawReferrerTypePieChart);
  }

}