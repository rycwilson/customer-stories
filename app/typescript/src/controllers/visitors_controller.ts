import ResourceController from './resource_controller';
import { getJSON } from '../utils';

export default class VisitorsController extends ResourceController {
  async initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;
    this.dispatch('loading');
    // console.log('getting visitors:', this.dataPathValue, this.searchParamsValue || 'no params')
    const dataPromise = getJSON(this.dataPathValue, this.searchParamsValue);
    const chartsPromise = this.getCharts();
    const [data] = await Promise.all([dataPromise, chartsPromise]);
    CSP.visitors = data.visitors;
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
}