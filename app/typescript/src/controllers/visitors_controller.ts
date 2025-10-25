import ResourceController from './resource_controller';
import { getJSON } from '../utils';

export default class VisitorsController extends ResourceController {
  async initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;
    this.dispatch('loading');
    // console.log('getting visitors:', this.dataPathValue, this.searchParamsValue || 'no params')
    const searchParams = new URLSearchParams({ 
      'time_zone': Intl.DateTimeFormat().resolvedOptions().timeZone 
    });
    const dataPromise = getJSON(this.dataPathValue, searchParams);
    const chartsPromise = this.getChartsLibrary();
    const [visitors,] = await Promise.all([dataPromise, chartsPromise]);
    CSP.visitors = visitors;
    this.drawVisitorsChart(visitors.by_date);
    // this.drawStoriesChart(visitors.by_story);
    // this.drawBarGraph(visitors.by_date);
    this.dispatch('ready', { detail: { resourceName: 'visitors' } });
  }

  getChartsLibrary(): Promise<void> {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.async = true;
      script.onload = () => {
        google.charts.load('current', { 'packages': ['corechart'] });
        google.charts.setOnLoadCallback(resolve);
      };
      document.head.appendChild(script);
    });
  }

  filtersValueChanged(newVal: ResourceFilters, oldVal: ResourceFilters) {

  }

  drawVisitorsChart(data: any[]) {
    // Preprocess data: ensure first column is a Date object and add header row
    const formattedData = [
      ['Period', 'Visitors'],
      ...data.map(([period, visitors]) => [new Date(period), visitors])
    ];
    const chartData = google.visualization.arrayToDataTable(formattedData);
    const options: google.visualization.ColumnChartOptions = { 
      title: 'Unique Visitors', 
      hAxis: { 
        title: 'Month',
        format: "MMM ''yy",
        slantedText: true,
        slantedTextAngle: 45
      },
      vAxis: { title: 'Visitors', minValue: 0 },
      legend: 'none',
      height: 350,
      backgroundColor: 'transparent',
      chartArea: {
        backgroundColor: 'white',
        top: 75,
        bottom: 100
      }
    };
    const container = document.getElementById('visitors-column-chart');
    if (!container) return;
    const chart = new google.visualization.ColumnChart(container);
    chart.draw(chartData, options);
  }

  // drawStoriesChart(data: any[]) {
  // }
}