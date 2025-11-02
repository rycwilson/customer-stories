import ResourceController from './resource_controller';
import { getJSON, toSnakeCase } from '../utils';
import { fromRatio } from 'tinycolor2';
import { capitalize, formatPercent } from '../utils';

type VisitorsBySource = [promote: number, link: number, search: number, other: number];
type DateRow = (
  [group: 'day' | 'week' | 'month', period: string, visitors: number] | 
  [group: 'day' | 'week' | 'month', period: string, ...VisitorsBySource]
);
type StoryRow = (
  [customer: string, title: string, visitors: number] |
  [customer: string, title: string, ...VisitorsBySource]
);

export default class VisitorsController extends ResourceController {
  static targets = ['columnChart', 'tableChart'];
  declare readonly columnChartTarget: HTMLDivElement;
  declare readonly tableChartTarget: HTMLDivElement;

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
          [`visitors_${toSnakeCase(key)}`, value === null ? '' : String(value)]
        ))
      ) 
    });
  }

  get isStacked() {
    return <boolean>this.filtersValue['show-visitor-source'];
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

  onChangeSearchSelect(e: CustomEvent) {
    const { id: filter } = e.detail;
    if (filter) {
      const [filterKey, filterVal] = filter.split('-');
      this.filtersValue = { ...this.filtersValue, ...{ [filterKey]: +filterVal } };
    } else {
      const { story, category, product, ...rest } = this.filtersValue;
      this.filtersValue = rest;
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
    this.element.classList.toggle('has-no-data', !this.hasData);
    if (!this.hasData) {
      [this.columnChartTarget, this.tableChartTarget].forEach(chart => chart.replaceChildren());
      return;
    }
    this.drawColumnChart();
    if (this.filtersValue['story']) {
      this.tableChartTarget.replaceChildren();
    } else {
      this.drawTableChart();
    } 
  }

  drawColumnChart() {
    const chart = new google.visualization.ColumnChart(this.columnChartTarget);
    const groupUnit = this.visitors.by_date[0][0];
    const total = this.visitors.by_date.reduce((sum, [,, ...visitors]: DateRow) => (
      sum + visitors.reduce((a, b) => a + b)
    ), 0);
    const countSource = (nthSource: number) => {
      if (!this.isStacked || nthSource < 1 || nthSource > 4) return 0;

      const index = nthSource + 1;
      return this.visitors.by_date.reduce((sum, row: DateRow) => {
        return (typeof row[index] === 'number') ? sum + row[index] : sum;
      }, 0);
    };
    const promoteLabel = this.isStacked && `Promote (${formatPercent(countSource(1), total)})`;
    const linkLabel = this.isStacked && `Link (${formatPercent(countSource(2), total)})`;
    const searchLabel = this.isStacked && `Search (${formatPercent(countSource(3), total)})`;
    const otherLabel = this.isStacked && `Other (${formatPercent(countSource(4), total)})`;
    const ticks: Date[] = [];
    const data = [
      this.isStacked ?
        ['Visitor Source', promoteLabel, linkLabel, searchLabel, otherLabel] :
        ['Group Start Date', 'Visitors'],
      ...this.visitors.by_date.map(([groupUnit, groupStartDate, ...visitors]) => {
        const [year, month, day] = groupStartDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        ticks.push(date);
        return [date, ...visitors];
      })
    ];
    const chartData = google.visualization.arrayToDataTable(data);
    const options: google.visualization.ColumnChartOptions = { 
      title: `Total Visitors: ${this.roundVisitors(total)}`, 
      titleTextStyle: {
        fontSize: 14,
        color: '#333'
      },
      hAxis: { 
        title: capitalize(groupUnit),
        format: (() => {
          switch (groupUnit) {
            case 'day':
            case 'week':
              return "d MMM ''yy";
            case 'month':
              return "MMM ''yy";
          }
        })(),
        ticks,
        titleTextStyle: { fontSize: 14 },
        textStyle: { fontSize: 14 },
        slantedText: data.length > 10,
        slantedTextAngle: 45
      },
      vAxis: { 
        title: 'Visitors', 
        minValue: 0,
        titleTextStyle: { fontSize: 14 },
        textStyle: { fontSize: 14 }
      },
      isStacked: this.isStacked,
      legend: this.isStacked ? { 
          position: 'top' ,
          textStyle: { fontSize: 14 },
        } : 
        'none',
      height: 350,
      backgroundColor: 'transparent',
      chartArea: {
        backgroundColor: 'white',
        top: 100,
        bottom: 100
      }
    };
    chart.draw(chartData, options);
  }

  drawTableChart() {
    const table = new google.visualization.Table(this.tableChartTarget);
    const data = new google.visualization.DataTable()
    data.addColumn('string', 'Customer');
    data.addColumn('string', 'Story');
    data.addColumn('number', 'Visitors');
    if (this.isStacked) {
      data.addColumn('number', 'Promote');
      data.addColumn('number', 'Link');
      data.addColumn('number', 'Search');
      data.addColumn('number', 'Other');
    }
    data.addRows(
      this.visitors.by_story.map(([customer, title, ...visitors]: StoryRow) => {
        const row: (string | number | { v: number, f: string })[] = [customer, title];
        if (this.isStacked) {
          const total = visitors.reduce((sum, count) => sum + count);
          row.push(
            total,
            ...visitors.map(count => ({
              v: total === 0 ? 0 : (count / total),
              f: formatPercent(count, total) === '0%' ? '<span style="color: #ccc">\u2014</span>' : formatPercent(count, total)
            }))
          );
        } else {
          row.push(visitors[0]);
        }
        return row;
      })
    );  
    const options: google.visualization.TableOptions = {
      // showRowNumber: false,
      // width: '100%',
      // height: '100%',
      allowHtml: true,
      sortColumn: 2, // 'Visitors' column
      sortAscending: false, // descending
      // cssClassNames: {
        // headerCell: 'visitors-table-header',
        // tableCell: 'visitors-table-cell',
        // oddTableRow: 'visitors-table-row-odd',
      // }
    };
    table.draw(data, options);
  }

  roundVisitors(visitors: number): string {
    return visitors >= 1000 ?
      (Math.round(visitors / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'K' :
      visitors.toString();
  }

  getChartsLibrary(): Promise<void> {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.async = true;
      script.onload = () => {
        google.charts.load('current', { 'packages': ['corechart', 'table'] });
        google.charts.setOnLoadCallback(resolve);
      };
      document.head.appendChild(script);
    });
  }
}