import { Controller } from '@hotwired/stimulus';
import { tsBaseOptions } from '../tomselect';

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
  declare storiesSelectTarget: TomSelectInput

  connect() {
    // console.log('connect plugins')
    this.initContentFilters();
  }

  initContentFilters() {

  }

  toggleSettingsDisplay({ target: input }: { target: HTMLInputElement }) {
    const panel = <HTMLDivElement>this.element.querySelector(`.plugin-config__${input.value.replace('_', '-')}`);
    [...panel.parentElement!.children].forEach(_panel => _panel.classList.toggle('hidden', _panel !== panel));
  }

  onChangePluginType({ target: input }: { target: HTMLInputElement }) {
    const type = input.value;
    this.logosOnlyCheckboxTarget.checked = false;
    this.logosOnlyCheckboxTarget.disabled = type !== 'gallery';
    this.codeTextAreaTarget.value = this.codeTextAreaTarget.value
      .replace(/id="(cs-gallery|cs-carousel|cs-tabbed-carousel)"/, `id="cs-${type.replace('_', '-')}"`)
      .replace(/\/plugins\/(gallery|carousel|tabbed_carousel)/, `/plugins/${type}`)

      // gallery settings
      .replace(/\sdata-max-rows="\d+"/ || /><\/script>/, () => {
        const maxRows = this.maxGalleryRowsInputTarget.value;
        return (type === 'gallery' && maxRows) ? `\xa0data-max-rows="${maxRows}"></script>` : '></script>';
      })
      
      // carousel settings
      .replace(/\sdata-background="(light|dark)"/, '')
      .replace(/><\/script>/, () => {
        const bg = this.carouselBackgroundRadioTargets.find((input: HTMLInputElement) => input.checked)!.value;
        return type === 'carousel' ? `\xa0data-background="${bg}"></script>` : '></script>';
      })

      // tabbed carousel settings
      .replace(/\sdata-tab-color="#\w+"\sdata-text-color="#\w+"\sdata-delay="\d+"/, '')
      .replace(/><\/script>/, () => {
        const tabColor = this.tabbedCarouselTabColorInputTarget.value;
        const textColor = this.tabbedCarouselTextColorInputTarget.value;
        const delay = this.tabbedCarouselDelayInputTarget.value;
        return type === 'tabbed_carousel' ?
          `\xa0data-tab-color="${tabColor}"\xa0data-text-color="${textColor}"\xa0data-delay="${delay}"></script>` :
          '></script>';
      });
  }

  onChangeMaxGalleryRows({ target: input }: { target: HTMLInputElement }) {
    const enabledDidToggle = input.type === 'checkbox';
    const maxRowsEnabled = enabledDidToggle ? !input.checked : true;
    if (enabledDidToggle) {
      this.maxGalleryRowsSpinnerTarget.setAttribute('data-input-spinner-enabled-value', maxRowsEnabled.toString());
      this.codeTextAreaTarget.value = this.codeTextAreaTarget.value.replace(
        maxRowsEnabled ? /><\/script>/ : /\sdata-max-rows="\d+"/,
        maxRowsEnabled ? 
          `\xa0data-max-rows="${this.maxGalleryRowsSpinnerTarget.dataset.inputSpinnerInitialValue!.toString()}"></script>` : 
          ''
      );
    } else {
      this.codeTextAreaTarget.value = this.codeTextAreaTarget.value.replace(
        /\sdata-max-rows="\d+"/,
        `\xa0data-max-rows="${this.maxGalleryRowsInputTarget.value.toString()}"`
      );
    }
  }

  updateAppearance({ target: checkbox }: { target: HTMLInputElement }) {
    const param = checkbox.name.match(/plugin\[(\w+)\]/)![1].replace('_', '-');   // logos_only, grayscale, etc
    this.codeTextAreaTarget.value = this.codeTextAreaTarget.value.replace(
      checkbox.checked ? /><\/script>/ : new RegExp(`\\sdata-${param}="true"`),
      checkbox.checked ? `\xa0data-${param}="true"></script>` : ''
    );
  }
}