import ResourceController from './resource_controller';
import { getJSON } from '../utils';

export default class VisitorsController extends ResourceController {
  async initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;
    this.dispatch('loading');
    // console.log('getting visitors:', this.dataPathValue, this.searchParamsValue || 'no params')
    const searchParams = new URLSearchParams({ 'time_zone': Intl.DateTimeFormat().resolvedOptions().timeZone });
    const dataPromise = getJSON(this.dataPathValue, searchParams);
    const chartsPromise = this.getCharts();
    const [visitors] = await Promise.all([dataPromise, chartsPromise]);
    CSP.visitors = visitors;
    // this.drawBarGraph(visitors.by_date);
    this.dispatch('ready', { detail: { resourceName: 'visitors' } });
  }

  getCharts(): Promise<void> {
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
  // drawBarGraph(data: ) {
  //   const data = new google.visualization.DataTable();
  //   data.addColumn('date', 'Date');
  //   data.addColumn('number', 'Visitors');
  //   CSP.visitors.by_date.forEach((row: any) => {
  //     data.addRow([new Date(row.date), row.visitors]);
  //   });
  //   const options = { title: 'Visitors by Date', legend: { position: 'none' }, height: 300 };
  //   const chart = new google.visualization.ColumnChart(document.getElementById('visitors-bar-graph')!);
  //   chart.draw(data, options);
  // }
}