import { Controller } from '@hotwired/stimulus';

interface TooltipOptions {
  title: string,
  container: string,
  placement?: string,
}

const baseOptions: TooltipOptions = { title: 'I am a tooltip', container: 'body' };

export default class TooltipController extends Controller {
  static values = {
    options: { type: Object, default: {} }
  }
  declare optionsValue: TooltipOptions;
  
  declare navItemObserver: MutationObserver | undefined;

  get tooltipElement() {
    return $(this.element).data('bs.tooltip').$tip;
  }

  connect() {
    $(this.element).tooltip({ ...baseOptions, ...this.optionsValue });

    // Don't show tooltip on active tab
    if (this.element.role === 'tab') {
      const navItem = this.element.parentElement;
      if (navItem instanceof HTMLLIElement) {
        this.toggleNavLink(navItem);
        this.navItemObserver = new MutationObserver(() => this.toggleNavLink(navItem));
        this.navItemObserver.observe(navItem, { attributes: true, attributeFilter: ['class'] });
      }
    }
  }

  disconnect() {
    $(this.element).tooltip('destroy');
    this.navItemObserver?.disconnect();
  }

  optionsValueChanged(options: TooltipOptions) {
    $(this.element).tooltip('destroy');
    $(this.element).tooltip({ ...baseOptions, ...options });
  }

  toggleNavLink(navItem: HTMLLIElement) {
    // This approach results in erratic hover and tooltip behavior in the first nav item
    // if (navItem.classList.contains('active')) {
    //   $(this.element).tooltip('hide');
    //   $(this.element).tooltip('disable')
    // } else {
    //   $(this.element).tooltip('enable');
    // }

    // Instead:
    $(this.element).tooltip('destroy');
    if (navItem.classList.contains('active')) return;
    $(this.element).tooltip({ 
      ...baseOptions, 
      ...this.optionsValue,
      container: this.element.closest('.sidebar--sans-text')
    });
  }
}