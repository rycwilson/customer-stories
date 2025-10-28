import ResourceController from './resource_controller';
import { getJSON, toSnakeCase } from '../utils';
import { fromRatio } from 'tinycolor2';

export default class VisitorsController extends ResourceController {
  static targets = ['columnChart', 'barChart', 'noDataMesg'];
  declare readonly columnChartTarget: HTMLDivElement;
  declare readonly barChartTarget: HTMLDivElement;
  declare readonly noDataMesgTarget: HTMLHeadingElement;
  
  declare visitors: { 
    by_date: [period: string, visitors: number][],
    by_story: [customer: string, title: string, visitors: number][] 
  };
  declare visibilityObserver: IntersectionObserver;
  
  initialized = false;

  get hasData() {
    return this.visitors?.by_date.length > 0;
  }

  get searchParams() {
    return new URLSearchParams({
      'time_zone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...Object.fromEntries(
        Object.entries(this.filtersValue).map(([key, value]) => [toSnakeCase(key), value || ''])
      ) 
    });
  }

  // connect() {
  // }
  
  async initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;

    this.dispatch('loading');
    const dataPromise = getJSON(this.dataPathValue, this.searchParams);
    const chartsPromise = this.getChartsLibrary();
    const [data,] = await Promise.all([dataPromise, chartsPromise]);
    // console.log(data)
    CSP.visitors = data;
    this.visitors = data;
    this.drawCharts();
    this.dispatch('ready', { detail: { resourceName: 'visitors' } });
    this.initialized = true;
  }

  async filtersValueChanged(newVal: ResourceFilters, oldVal: ResourceFilters) {
    if (this.initialized === false) return;
    
    console.log('old visitors filtersValue:', oldVal)
    console.log('new visitors filtersValue:', newVal)

    const data = await getJSON(this.dataPathValue, this.searchParams);
    CSP.visitors = data;
    this.visitors = data;

    // The charts won't render correctly if drawn when not visible
    if (this.element.checkVisibility()) {
      this.drawCharts();
    } else {
      this.onPanelVisible(this.drawCharts.bind(this));
    }
  }

  onPanelVisible(callback: () => void, options?: IntersectionObserverInit) {
    if (this.visibilityObserver) this.visibilityObserver.disconnect();
    this.visibilityObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback();
          this.visibilityObserver.disconnect();
        }   
      });
    }, options);
    this.visibilityObserver.observe(this.element);
  }

  drawCharts() {
    this.noDataMesgTarget.classList.toggle('hidden', this.hasData);
    if (!this.hasData) {
      [this.columnChartTarget, this.barChartTarget].forEach(chart => chart.replaceChildren());
      return;
    }

    this.drawColumnChart();
    this.drawBarChart();
  }

  drawColumnChart() {
    const formattedData = [
      ['Period', 'Visitors'],
      ...this.visitors.by_date.map(([period, visitors]) => [new Date(period), visitors])
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
    const chart = new google.visualization.ColumnChart(this.columnChartTarget);
    chart.draw(chartData, options);
  }

  drawBarChart() {
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
}