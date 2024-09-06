import { Controller } from '@hotwired/stimulus';
import { hexToRgb, backgroundShade } from '../utils';

export default class PluginsController extends Controller<HTMLFormElement> {
  static targets = [
    'logosOnlyCheckbox', 
    'codeTextArea', 
    'maxGalleryRowsSpinner',
    'maxGalleryRowsInput', 
    'carouselBackgroundRadio',
    'tabbedCarouselTabColorInput',
    'tabbedCarouselTextColorInput',
    'tabbedCarouselDelayInput',
  ];
  declare logosOnlyCheckboxTarget: HTMLInputElement;
  declare codeTextAreaTarget: HTMLTextAreaElement;
  declare maxGalleryRowsSpinnerTarget: HTMLDivElement;
  declare maxGalleryRowsInputTarget: HTMLInputElement;
  declare carouselBackgroundRadioTargets: HTMLInputElement[];
  declare tabbedCarouselTabColorInputTarget: HTMLInputElement;
  declare tabbedCarouselTextColorInputTarget: HTMLInputElement;
  declare tabbedCarouselDelayInputTarget: HTMLInputElement;

  connect() {
    // console.log('connect plugins')
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
    const pluginType = input.value.replace('_', '-');
    this.logosOnlyCheckboxTarget.checked = false;
    this.logosOnlyCheckboxTarget.disabled = pluginType !== 'gallery';
    this.codeTextAreaTarget.value = this.codeTextAreaTarget.value
      .replace(/gallery|carousel|tabbed-carousel/g, pluginType)

      // gallery settings<div id="cs-gallery" class="cs-plugin"></div><script src="http://acme-test.lvh.me:3000/plugins/gallery/cs.js" data-max-rows="4"></script>
      .replace(/\sdata-max-rows="\d+"/, '')
      .replace('></script>', () => {
        const maxRows = this.maxGalleryRowsInputTarget.value;
        return (pluginType === 'gallery' && maxRows) ? `\u00A0data-max-rows="${maxRows}"></script>` : '></script>';
      })
      
      // carousel settings
      .replace(/\sdata-background="(light|dark)"/, '')
      .replace('></script>', () => {
        const checkedInput = <HTMLInputElement>this.carouselBackgroundRadioTargets.find((input: HTMLInputElement) => input.checked);
        return pluginType === 'carousel' ? `\u00A0data-background="${checkedInput.value}"></script>` : '></script>';
      })

      // tabbed carousel settings
      .replace(/\sdata-tab-color="#\w+"\sdata-text-color="#\w+"\sdata-delay="\d+"/, '')
      .replace('></script>', () => {
        const tabColor = this.tabbedCarouselTabColorInputTarget.value;
        const textColor = this.tabbedCarouselTextColorInputTarget.value;
        const delay = this.tabbedCarouselDelayInputTarget.value;
        return pluginType === 'tabbed-carousel' ?
          `\u00A0data-tab-color="${tabColor}"\u00A0data-text-color="${textColor}"\u00A0data-delay="${delay}"></script>` :
          '></script>';
      })

      // appearance settings
      .replace(/\sdata-logos-only="true"/, '')
  }

  toggleMaxGalleryRows({ target: checkbox }: { target: HTMLInputElement }) {
    const maxRowsEnabled = !checkbox.checked;
    const initialValue = this.maxGalleryRowsSpinnerTarget.dataset.inputSpinnerInitialValue;
    this.maxGalleryRowsSpinnerTarget.setAttribute('data-input-spinner-enabled-value', maxRowsEnabled.toString());
    this.codeTextAreaTarget.value = this.codeTextAreaTarget.value.replace(
      maxRowsEnabled ? '></script>' : /\sdata-max-rows="\d+"/,
      maxRowsEnabled ? `\u00A0data-max-rows="${initialValue}"></script>` : ''
    );
  }

  updateSetting({ target: input }: { target: HTMLInputElement }) {
    const setting = input.name.match(/max_rows|background|tab_color|text_color|delay|logos_only|grayscale/)![0].replace('_', '-');
    if (/logos-only|grayscale/.test(setting)) {
      this.codeTextAreaTarget.value = this.codeTextAreaTarget.value.replace(
        input.checked ? /><\/script>/ : new RegExp(`\\sdata-${setting}="true"`),
        input.checked ? `\u00A0data-${setting}="true"></script>` : ''
      );
    } else {
      this.codeTextAreaTarget.value = this.codeTextAreaTarget.value
        .replace(new RegExp(`data-${setting}="#?\\w+"`), `data-${setting}="${input.value}"`);
    }
  }

  onChangeFilter({ target: select }: { target: TomSelectInput }) {
    const filter: 'category' | 'product' = select.dataset.tomselectKindValue;
    const filterRegExp = new RegExp(`\\sdata-${filter}="(\\w|-)*"`);
    const isFirstSelection = select.value && !this.codeTextAreaTarget.value.match(filterRegExp);
    const [selectedOption] = [...select.options].filter(option => option.selected);
    this.codeTextAreaTarget.value = this.codeTextAreaTarget.value
      .replace(
        isFirstSelection ? /><\/script>/ : filterRegExp,
        select.value ? 
          `\u00A0data-${filter}="${selectedOption.dataset.slug}"` + (isFirstSelection ? '></script>' : '') : 
          ''
      );
    // .replace(/\u00A0data-stories="\[((\d+(,)?)+)?\]"/, '')
  }

  onChangeStories({ target: select }: { target: TomSelectInput }) {
    const isFirstSelection = !this.codeTextAreaTarget.value.match(/data-stories/);
    const stories = [...select.options].filter(option => option.selected).map(option => +option.value);
    this.codeTextAreaTarget.value = this.codeTextAreaTarget.value
      .replace(/\sdata-(category|product)="(\w|-)*"/, '')
      .replace(
        isFirstSelection ? /><\/script>/ : /\sdata-stories="\[((\d+(,)?)+)?\]"/,
        stories.length ? 
          `\u00A0data-stories="${JSON.stringify(stories)}"` + (isFirstSelection ? '></script>' : '') :
          ''
      );
  }

  checkTabContrast({ target: input }: { target: HTMLInputElement }) {
    const tabColor = hexToRgb(input.value) as { r: number, b: number, g: number };
    const textColorInput = this.tabbedCarouselTextColorInputTarget;
    const lightTextColor = '#ffffff';
    const darkTextColor = '#333333';
    if (backgroundShade(tabColor) === 'light' && textColorInput.value !== darkTextColor) {
      textColorInput.value = darkTextColor;
    } else if (backgroundShade(tabColor) === 'dark' && textColorInput.value !== lightTextColor) {
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

  openDemo(e: Event) {
    e.preventDefault();
    const formParams = new FormData(this.element);
    const searchParams = new URLSearchParams();
    const width = window.innerWidth * 0.85;
    const height = window.innerHeight * 0.85;
    const top = ((window.innerHeight / 2) - (height / 2)) + window.screenTop;
    const left = ((window.innerWidth / 2) - (width / 2)) + window.screenLeft;
    for (const [param, value] of formParams) {
      const isOtherContent = (
        param.match(/stories|category|product/) && !param.includes(<string>formParams.get('plugin[content]'))
      );
      const isOtherType = (
        param.match(/gallery|carousel|tabbed_carousel/) && !param.includes(<string>formParams.get('plugin[type]'))
      );
      if (isOtherContent || isOtherType || param === 'plugin[content]') {
        continue;
      } else {
        searchParams.append(param, value as string);
      }
    }
    window.open(
      `/plugins/demo?${searchParams.toString()}`, 
      'pluginDemoWindow', 
      `width=${width},height=${height},top=${top},left=${left},noopener,noreferrer`
    );
  }

  copyCode({ currentTarget: btn }: { currentTarget: HTMLButtonElement }) {
    const temp = <HTMLTextAreaElement>document.createElement('textarea');
    const toggleBtn = (didCopy: boolean) => {
      [...btn.children].forEach(child => child.classList.toggle('hidden'));
      btn.disabled = didCopy;
      btn.style.cursor = didCopy ? 'default' : 'pointer';
    };
    temp.innerText = this.codeTextAreaTarget.textContent!;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    temp.remove();
    toggleBtn(true);
    setTimeout(() => toggleBtn(false), 1500); 
  }
}