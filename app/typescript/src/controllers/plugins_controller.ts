import { Controller } from '@hotwired/stimulus';

export default class PluginsController extends Controller<HTMLDivElement> {
  static targets = ['logosOnlyCheckbox', 'codeTextArea', 'maxRowsInput', 'carouselBackgroundRadio'];
  declare logosOnlyCheckboxTarget: HTMLInputElement;
  declare codeTextAreaTarget: HTMLTextAreaElement;
  declare maxRowsInputTarget: HTMLInputElement;
  declare carouselBackgroundRadioTargets: HTMLInputElement[];

  connect() {
    console.log('connect plugins')
  }

  onChangeType({ target: input }: { target: HTMLInputElement }) {
    const type = input.value;
    this.logosOnlyCheckboxTarget.checked = false;
    this.logosOnlyCheckboxTarget.disabled = type !== 'gallery';
    this.codeTextAreaTarget.value = this.codeTextAreaTarget.value
      .replace(/id="(cs-gallery|cs-carousel|cs-tabbed-carousel)"/, `id="cs-${type.replace('_', '-')}"`)
      .replace(/\/plugins\/(gallery|carousel|tabbed_carousel)/, `/plugins/${type}`)
      // gallery settings
      .replace(/\sdata-max-rows="\d+"/, '')
      .replace(/><\/script>/, () => {
        const maxRows = this.maxRowsInputTarget.value;
        return (type === 'gallery' && maxRows) ? `\xa0data-max-rows="${maxRows}"></script>` : '></script>';
      })
      // carousel settings
      .replace(/\sdata-background="(light|dark)"/, '')
      .replace(/><\/script>/, () => {
        const bg = this.carouselBackgroundRadioTargets.find((input: HTMLInputElement) => input.checked)!.value;
        return type === 'carousel' ? `\xa0data-background="${bg}"></script>` : '></script>';
      })
      // tabbed carousel settings
      // .replace(/\sdata-tab-color="#\w+"\sdata-text-color="#\w+"\sdata-delay="\d+"/, '')
      // .replace(/><\/script>/, () => {
      //   const tabColor = document.querySelector('[name="plugin[tabbed_carousel][tab_color]"]').value;
      //   const textColor = document.querySelector('[name="plugin[tabbed_carousel][text_color]"]').value;
      //   const delay = document.querySelector('[name="plugin[tabbed_carousel][delay]"]').value;
      //   return type === 'tabbed_carousel' ?
      //     `\xa0data-tab-color="${tabColor}"\xa0data-text-color="${textColor}"\xa0data-delay="${delay}"></script>` :
      //     '></script>';
      // });
  }

  updateAppearance({ target: checkbox }: { target: HTMLInputElement }) {
    const param = checkbox.name.match(/plugin\[(\w+)\]/)![1].replace('_', '-');   // logos_only, grayscale, etc
    this.codeTextAreaTarget.value = this.codeTextAreaTarget.value.replace(
      checkbox.checked ? /><\/script>/ : new RegExp(`\\sdata-${param}="true"`),
      checkbox.checked ? `\xa0data-${param}="true"></script>` : ''
    );
  }
}