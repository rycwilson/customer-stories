import { Controller } from '@hotwired/stimulus';

export default class StoryController extends Controller<HTMLDivElement> {
  static targets = [
    'storySettingsForm', 
    'storyContentForm', 
    'hiddenLinkInput', 
    'hiddenLinkCopyBtn',
    'contributors',
    'publishSwitch',
  ];
  declare readonly storySettingsFormTarget: HTMLFormElement;
  declare readonly storyContentFormTarget: HTMLFormElement;
  declare readonly hiddenLinkInputTarget: HTMLInputElement;
  declare readonly hiddenLinkCopyBtnTarget: HTMLButtonElement;
  declare readonly contributorsTarget: HTMLDivElement;
  declare readonly publishSwitchTargets: HTMLInputElement[];
 
  connect() {
    // this.storySettingsFormTarget.setAttribute('data-init', 'true');
    this.contributorsTarget.setAttribute('data-resource-init-value', 'true');
    this.publishSwitchTargets.forEach(checkbox => {
      $(checkbox).bootstrapSwitch({
        disabled: checkbox!.name.includes('preview'),
        animate: false,
        onInit: function (e: Event) {}
      });
    });
  }

  refreshHiddenLink() {
    // $(this).blur();
    // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
    const hiddenLink = window.location.origin + '/' + Date.now().toString(36) + Math.random().toString(36).substring(2);
    this.hiddenLinkInputTarget.value = hiddenLink;
    this.hiddenLinkCopyBtnTarget.setAttribute('title', 'Save changes to enable Copy');

    // $('.hidden-link__copy')
    //   .tooltip('fixTitle')
    //   .addClass('disabled')
  }
}