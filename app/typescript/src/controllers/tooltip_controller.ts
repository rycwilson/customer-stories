import { Controller } from '@hotwired/stimulus';
import { debounce } from '../utils';

interface TooltipOptions {
  title?: string,
  container?: string,
  placement?: string,
}

const baseOptions: TooltipOptions = { title: 'I am a tooltip', container: 'body' };

export default class TooltipController extends Controller {
  static values = {
    enabled: { type: Boolean, default: true },
    options: Object
  }

  private declare enabledValue: boolean;
  private declare optionsValue: TooltipOptions;
  private declare sidebar: HTMLElement | null;
  private declare sidebarObserver: MutationObserver | undefined;

  private get tooltipElement() {
    return $(this.element).data('bs.tooltip').$tip;
  }

  private get hasTooltip() {
    return !!$(this.element).data('bs.tooltip');
  }

  connect() {
    this.sidebar = this.element.closest<HTMLElement>('.sidebar');
    if (this.sidebar) {
      this.watchSidebarForChanges();
    } else if (this.enabledValue) {
      this.init();
    }
  }

  disconnect() {
    $(this.element).tooltip('destroy');
    this.sidebarObserver?.disconnect();
  }

  init() {
    $(this.element).tooltip({ 
      ...baseOptions, 
      ...this.optionsValue,
      ...(this.sidebar ? { container: this.sidebar } : {})
    });
  }

  enabledValueChanged(shouldEnable: boolean, wasEnabled: boolean | undefined) {
    if (wasEnabled === undefined) return; // ignore the default assignment

    if (shouldEnable && !this.hasTooltip) {
      this.init();
    } else {
      $(this.element).tooltip('destroy');
    }
  }

  optionsValueChanged(options: TooltipOptions, prevOptions: TooltipOptions) {
    if (Object.keys(prevOptions).length === 0) return; // ignore the initial assignment
    
    $(this.element).tooltip('destroy');
    this.init();
  }

  watchSidebarForChanges() {
    if (!this.sidebar) return;

    const navItem = this.element.parentElement as HTMLLIElement;
    const collapsed = () => this.sidebar!.classList.contains('sidebar--collapsed');
    const isActiveTab = () => navItem!.classList.contains('active');
    const update = () => this.enabledValue = collapsed() && !isActiveTab();
    update();
    this.sidebarObserver = new MutationObserver(debounce(update, 100));
    this.sidebarObserver.observe(this.sidebar, { attributes: true, attributeFilter: ['class'] });
    this.sidebarObserver.observe(navItem, { attributes: true, attributeFilter: ['class'] });
  }
}