import { Controller } from '@hotwired/stimulus';
import { debounce } from '../utils';

interface TooltipOptions {
  title: string,
  container: string,
  placement?: string,
}

const baseOptions: TooltipOptions = { title: 'I am a tooltip', container: 'body' };

export default class TooltipController extends Controller {
  static values = {
    enabled: { type: Boolean, default: true },
    options: { type: Object, default: {} }
  }
  declare enabledValue: boolean;
  declare optionsValue: TooltipOptions;

  declare sidebar: HTMLElement | null;
  declare sidebarObserver: MutationObserver | undefined;

  get tooltipElement() {
    return $(this.element).data('bs.tooltip').$tip;
  }

  get hasTooltip() {
    return !!$(this.element).data('bs.tooltip');
  }

  connect() {
    this.sidebar = this.element.closest<HTMLElement>('.sidebar');
    if (this.enabledValue) this.init();
    if (this.sidebar) this.watchSidebarForChanges();
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

  optionsValueChanged(_options: TooltipOptions, oldValue: TooltipOptions | undefined) {
    if (oldValue === undefined) return; // ignore the default assignment

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