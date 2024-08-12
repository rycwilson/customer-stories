import { Controller } from '@hotwired/stimulus';
import { hexToRgb, colorContrast } from '../utils';

export default class PluginsController extends Controller<HTMLDivElement> {
  static targets = [
    'logosOnlyCheckbox', 
    'codeTextArea', 
    'maxGalleryRowsSpinner',
    'maxGalleryRowsInput', 
    'carouselBackgroundRadio',
    'tabbedCarouselTabColorInput',
    'tabbedCarouselTextColorInput',
    'tabbedCarouselDelayInput',
    'storiesSelect'
  ];
  declare logosOnlyCheckboxTarget: HTMLInputElement;
  declare codeTextAreaTarget: HTMLTextAreaElement;
  declare maxGalleryRowsSpinnerTarget: HTMLDivElement;
  declare maxGalleryRowsInputTarget: HTMLInputElement;
  declare carouselBackgroundRadioTargets: HTMLInputElement[];
  declare tabbedCarouselTabColorInputTarget: HTMLInputElement;
  declare tabbedCarouselTextColorInputTarget: HTMLInputElement;
  declare tabbedCarouselDelayInputTarget: HTMLInputElement;
  declare storiesSelectTarget: TomSelectInput;

  connect() {
    // console.log('connect plugins')
    this.initContentFilters();
  }

  initContentFilters() {

  }

  toggleSettingsDisplay({ target: input }: { target: HTMLInputElement }) {
    const panel = <HTMLDivElement>this.element.querySelector(`.plugin-config__${input.value.replace('_', '-')}`);
    [...panel.parentElement!.children].forEach(_panel => {
      _panel.classList.toggle('hidden', _panel !== panel);
      [..._panel.querySelectorAll('select.tomselected')]
        .filter((select: TomSelectInput) => select.value)
        .forEach((select: TomSelectInput) => select.tomselect.clear());
    });
  }

  onChangePluginType({ target: input }: { target: HTMLInputElement }) {
    const pluginType = input.value;
    this.logosOnlyCheckboxTarget.checked = false;
    this.logosOnlyCheckboxTarget.disabled = pluginType !== 'gallery';
    this.codeTextAreaTarget.value = this.codeTextAreaTarget.value
      .replace(/id="(cs-gallery|cs-carousel|cs-tabbed-carousel)"/, `id="cs-${pluginType.replace('_', '-')}"`)
      .replace(/\/plugins\/(gallery|carousel|tabbed_carousel)/, `/plugins/${pluginType}`)

      // gallery settings
      .replace(/\sdata-max-rows="\d+"/, '')
      .replace(/><\/script>/, () => {
        const maxRows = this.maxGalleryRowsInputTarget.value;
        return (pluginType === 'gallery' && maxRows) ? `\xa0data-max-rows="${maxRows}"></script>` : '></script>';
      })
      
      // carousel settings
      .replace(/\sdata-background="(light|dark)"/, '')
      .replace(/><\/script>/, () => {
        const bg = this.carouselBackgroundRadioTargets.find((input: HTMLInputElement) => input.checked)!.value;
        return pluginType === 'carousel' ? `\xa0data-background="${bg}"></script>` : '></script>';
      })

      // tabbed carousel settings
      .replace(/\sdata-tab-color="#\w+"\sdata-text-color="#\w+"\sdata-delay="\d+"/, '')
      .replace(/><\/script>/, () => {
        const tabColor = this.tabbedCarouselTabColorInputTarget.value;
        const textColor = this.tabbedCarouselTextColorInputTarget.value;
        const delay = this.tabbedCarouselDelayInputTarget.value;
        return pluginType === 'tabbed_carousel' ?
          `\xa0data-tab-color="${tabColor}"\xa0data-text-color="${textColor}"\xa0data-delay="${delay}"></script>` :
          '></script>';
      })

      // appearance settings
      .replace(/\sdata-logos-only="true"/, '')
  }

  toggleMaxGalleryRows({ target: input }: { target: HTMLInputElement }) {
    const maxRowsEnabled = !input.checked;
    this.maxGalleryRowsSpinnerTarget.setAttribute('data-input-spinner-enabled-value', maxRowsEnabled.toString());
    this.codeTextAreaTarget.value = this.codeTextAreaTarget.value.replace(
      maxRowsEnabled ? /><\/script>/ : /\sdata-max-rows="\d+"/,
      maxRowsEnabled ? 
        `\xa0data-max-rows="${this.maxGalleryRowsSpinnerTarget.dataset.inputSpinnerInitialValue}"></script>` : 
        ''
    );
  }

  updateSetting({ target: input }: { target: HTMLInputElement }) {
    const setting = input.name.match(/max_rows|background|tab_color|text_color|delay|logos_only|grayscale/)![0].replace('_', '-');
    if (/logos-only|grayscale/.test(setting)) {
      this.codeTextAreaTarget.value = this.codeTextAreaTarget.value.replace(
        input.checked ? /><\/script>/ : new RegExp(`\\sdata-${setting}="true"`),
        input.checked ? `\xa0data-${setting}="true"></script>` : ''
      );
    } else {
      this.codeTextAreaTarget.value = this.codeTextAreaTarget.value
        .replace(new RegExp(`data-${setting}="#?\\w+"`), `data-${setting}="${input.value}"`);
    }
  }

  updateFilter({ target: select }: { target: TomSelectInput }) {
    const filter: 'category' | 'product' = select.dataset.tomselectKindValue;
    const filterRegExp = new RegExp(`\\sdata-${filter}="(\\w|-)*"`);
    const isFirstSelection = select.value && !this.codeTextAreaTarget.value.match(filterRegExp);
    const [selectedOption] = [...select.options].filter(option => option.selected);
    this.codeTextAreaTarget.value = this.codeTextAreaTarget.value
      .replace(
        isFirstSelection ? /><\/script>/ : filterRegExp,
        select.value ? `\xa0data-${filter}="${selectedOption.dataset.slug}"` + (isFirstSelection ? '></script>' : '') : ''
      );
    // .replace(/\xa0data-stories="\[((\d+(,)?)+)?\]"/, '')
  }

  updateStories({ target: select }: { target: TomSelectInput }) {
    const isFirstSelection = !this.codeTextAreaTarget.value.match(/data-stories/);
    const stories = [...select.options].filter(option => option.selected).map(option => +option.value);
    this.codeTextAreaTarget.value = this.codeTextAreaTarget.value
      .replace(/\sdata-(category|product)="(\w|-)*"/, '')
      .replace(
        isFirstSelection ? /><\/script>/ : /\sdata-stories="\[((\d+(,)?)+)?\]"/,
        stories.length ? 
          `\xa0data-stories="${JSON.stringify(stories)}"` + (isFirstSelection ? '></script>' : '') :
          ''
      );
    // $(`[name="plugin[category]"], [name="plugin[product]"]`).val('').trigger('change.select2');
  }

  checkTabContrast({ target: input }: { target: HTMLInputElement }) {
    const tabColor = hexToRgb(input.value) as { r: number, b: number, g: number };
    const textColorInput = this.tabbedCarouselTextColorInputTarget;
    const lightTextColor = '#ffffff';
    const darkTextColor = '#333333';
    if (colorContrast(tabColor) === 'bg-light' && textColorInput.value !== darkTextColor) {
      textColorInput.value = darkTextColor;
    } else if (colorContrast(tabColor) === 'bg-dark' && textColorInput.value !== lightTextColor) {
      textColorInput.value = lightTextColor;
    } else {
      return;
    }
    input.addEventListener(
      'focusout', 
      () => textColorInput.dispatchEvent(new Event('change')),
      { once: true }
    );
  }
}