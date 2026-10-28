import { Resource } from '.';
import { convertCase, capitalize, formatPercent } from '../utils';

type VisitorsBySource = [ promote: number, link: number, search: number, other: number ];

type DateRow = (
  [ group: 'day' | 'week' | 'month', period: string, visitors: number ] | 
  [ group: 'day' | 'week' | 'month', period: string, ...VisitorsBySource ]
);

type StoryRow = (
  [customer: string, title: string, visitors: number] |
  [customer: string, title: string, ...VisitorsBySource]
);

export type VisitorsSourceData = { by_date: DateRow[], by_story: StoryRow[] } | undefined;

export type VisitorsFilters = DashboardFilters & {
  'date-range': string, 
  'show-visitor-source': boolean,
  story?: number,
  category?: number,
  product?: number
};

export default class Visitors extends Resource {
  private static getChartsLibrary(): Promise<void> {
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

  private declare dataPath: string;
  private declare data: VisitorsSourceData;
  private declare filters: VisitorsFilters;
  private declare visibilityObserver: IntersectionObserver;
  private declare columnChartContainer: HTMLElement;
  private declare tableChartContainer: HTMLElement;
  private initialized = false;

  async init(
    dataPath: string,
    filters: VisitorsFilters,
    columnChartContainer: HTMLElement,
    tableChartContainer: HTMLElement
  ): Promise<VisitorsSourceData> {
    this.dataPath = dataPath;
    this.filters = filters;
    this.columnChartContainer = columnChartContainer;
    this.tableChartContainer = tableChartContainer;
    const dataPromise = this.getJSON<VisitorsSourceData>(dataPath, this.searchParams());
    const chartsPromise = Visitors.getChartsLibrary();
    const [data,] = await Promise.all([dataPromise, chartsPromise]);
    this.data = data;
    this.drawCharts();
    this.initialized = true;
    return data;
  }

  get hasData() {
    return (this.data?.by_date ?? []).length > 0
  }

  searchParams() {
    return new URLSearchParams({
      'time_zone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...Object.fromEntries(
        Object.entries(this.filters).map(([key, value]) => (
          [`visitors_${convertCase(key, 'snake')}`, value === null ? '' : String(value)]
        ))
      ) 
    });
  }

  drawCharts() {
    this.container.classList.toggle('has-no-data', !this.hasData);
    if (!this.hasData) {
      [this.columnChartContainer, this.tableChartContainer].forEach(chart => chart.replaceChildren());
      return;
    }
    this.drawColumnChart();
    if (this.filters['story']) {
      this.tableChartContainer.replaceChildren();
    } else {
      this.drawTableChart();
    } 
  }

  async handleFiltersChanged(filters: VisitorsFilters) {
    if (!this.initialized) return;

    this.filters = filters;
    const data = await this.getJSON<VisitorsSourceData>(this.dataPath, this.searchParams())
    this.data = data;

    // The charts won't render correctly if drawn when not visible
    if (this.container.checkVisibility()) {
      this.drawCharts();
    } else {
      this.drawChartsWhenVisible();
    }
  }

  private drawChartsWhenVisible(callback?: VoidFunction, options?: IntersectionObserverInit) {
    if (this.visibilityObserver) this.visibilityObserver.disconnect();
    this.visibilityObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // callback();
          this.drawCharts();
          this.visibilityObserver.disconnect();
        }   
      });
    }, options);
    this.visibilityObserver.observe(this.container);
  }

  private roundVisitors(visitors: number): string {
    return visitors >= 1000 ?
      (Math.round(visitors / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'K' :
      visitors.toString();
  }

  private drawColumnChart() {
    if (!this.hasData) return;

    const isStacked = !!this.filters['show-visitor-source'];
    const chart = new google.visualization.ColumnChart(this.columnChartContainer);
    const groupUnit = this.data!.by_date[0][0];
    const total = this.data!.by_date.reduce((sum, [,, ...visitors]: DateRow) => (
      sum + visitors.reduce((a, b) => a + b)
    ), 0);
    const countSource = (nthSource: number) => {
      if (!isStacked || nthSource < 1 || nthSource > 4) return 0;

      const index = nthSource + 1;
      return this.data!.by_date.reduce((sum, row: DateRow) => {
        const element = row[index];
        if (typeof element !== 'number') return sum;
        return sum + element;
      }, 0);
    };
    const promoteLabel = isStacked && `Promote (${formatPercent(countSource(1), total)})`;
    const linkLabel = isStacked && `Link (${formatPercent(countSource(2), total)})`;
    const searchLabel = isStacked && `Search (${formatPercent(countSource(3), total)})`;
    const otherLabel = isStacked && `Other (${formatPercent(countSource(4), total)})`;
    const ticks: Date[] = [];
    const data = [
      isStacked ?
        ['Visitor Source', promoteLabel, linkLabel, searchLabel, otherLabel] :
        ['Group Start Date', 'Visitors'],
      ...this.data!.by_date.map(([_groupUnit, groupStartDate, ...visitors]) => {
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
      isStacked: isStacked,
      legend: isStacked ? { 
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

  private drawTableChart() {
    if (!this.hasData) return;

    const isStacked = !!this.filters['show-visitor-source'];
    const table = new google.visualization.Table(this.tableChartContainer);
    const data = new google.visualization.DataTable()
    data.addColumn('string', 'Customer');
    data.addColumn('string', 'Story');
    data.addColumn('number', 'Visitors');
    if (isStacked) {
      data.addColumn('number', 'Promote');
      data.addColumn('number', 'Link');
      data.addColumn('number', 'Search');
      data.addColumn('number', 'Other');
    }
    data.addRows(
      this.data!.by_story.map(([customer, title, ...visitors]: StoryRow) => {
        const row: (string | number | { v: number, f: string })[] = [customer, title];
        if (isStacked) {
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
}
