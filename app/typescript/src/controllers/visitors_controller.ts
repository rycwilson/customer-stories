import ResourceController from './resource_controller';
import { getJSON, toSnakeCase } from '../utils';
import { fromRatio } from 'tinycolor2';

type DateRow = [period: string, visitors: number] | [period: string, promote: number, link: number, search: number, other: number];
type StoryRow = [customer: string, title: string, visitors: number];

export default class VisitorsController extends ResourceController {
  static targets = ['columnChart', 'barChart', 'noDataMesg'];
  declare readonly columnChartTarget: HTMLDivElement;
  declare readonly barChartTarget: HTMLDivElement;
  declare readonly noDataMesgTarget: HTMLHeadingElement;

  declare visitors: { by_date: DateRow[], by_story: StoryRow[] };
  declare visibilityObserver: IntersectionObserver;

  initialized = false;

  get hasData() {
    return this.visitors?.by_date.length > 0;
  }

  get searchParams() {
    return new URLSearchParams({
      'time_zone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...Object.fromEntries(
        Object.entries(this.filtersValue).map(([key, value]) => (
          [toSnakeCase(key), value === null ? '' : String(value)]
        ))
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
    
    // console.log('old visitors filtersValue:', oldVal)
    // console.log('new visitors filtersValue:', newVal)

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
    const isStacked = <boolean>this.filtersValue['show-visitor-source'];
    const total = isStacked ?
      this.visitors.by_date.reduce((sum, [, ...visitors]: DateRow) => (
        sum + visitors.reduce((a, b) => a + b)
      ), 0) :
      this.visitors.by_date.reduce((sum, [, visitors]: DateRow) => sum + visitors, 0);
    const countSource = (nthSource: number) => {
      if (!isStacked || nthSource < 1 || nthSource > 4) return;

      return this.visitors.by_date.reduce((sum, row: DateRow) => {
        if (typeof row[nthSource] !== 'number') return sum;
        return sum + row[nthSource];
      }, 0);
    };
    const pctTotal = (count: number) => Number(((count / total) * 100).toFixed(1));
    const promoteVisitors = isStacked && countSource(1);
    const promoteLabel = promoteVisitors && `Promote (${pctTotal(promoteVisitors)}%)`;
    const linkVisitors = isStacked && countSource(2);
    const linkLabel = linkVisitors && `Link (${pctTotal(linkVisitors)}%)`;
    const searchVisitors = isStacked && countSource(3);
    const searchLabel = searchVisitors && `Search (${pctTotal(searchVisitors)}%)`;
    const otherVisitors = isStacked && countSource(4);
    const otherLabel = otherVisitors && `Other (${pctTotal(otherVisitors)}%)`;
    const formattedData = [
      isStacked ?
        ['Visitor Source', promoteLabel, linkLabel, searchLabel, otherLabel] :
        ['Period', 'Visitors'],
      ...this.visitors.by_date.map(([period, ...visitors]) => ([
        new Date(period), 
        ...visitors
      ]))
    ];
    const chartData = google.visualization.arrayToDataTable(formattedData);
    const formattedTotal = total >= 1000 ?
      (Math.round(total / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'K' :
      total.toString();
    const options: google.visualization.ColumnChartOptions = { 
      title: `Total Visitors: ${formattedTotal}`, 
      hAxis: { 
        title: 'Month',
        format: "MMM ''yy",
        slantedText: true,
        slantedTextAngle: 45
      },
      vAxis: { title: 'Visitors', minValue: 0 },
      isStacked,
      legend: isStacked ? { position: 'top' } : 'none',
      height: 350,
      backgroundColor: 'transparent',
      chartArea: {
        backgroundColor: 'white',
        top: 100,
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