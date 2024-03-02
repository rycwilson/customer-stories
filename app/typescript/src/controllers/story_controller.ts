import { Controller } from '@hotwired/stimulus';

export default class StoryController extends Controller<HTMLDivElement> {
  static targets = [
    'storySettingsForm', 
    'storyContentForm', 
    'hiddenLinkInput', 
    'hiddenLinkCopyBtn',
    'contributors'
  ];
  declare readonly storySettingsFormTarget: HTMLFormElement;
  declare readonly storyContentFormTarget: HTMLFormElement;
  declare readonly hiddenLinkInputTarget: HTMLInputElement;
  declare readonly hiddenLinkCopyBtnTarget: HTMLButtonElement;
  declare readonly contributorsTarget: HTMLDivElement;

  connect() {
    console.log('connect story')
    this.storySettingsFormTarget.setAttribute('data-init', 'true');
    this.contributorsTarget.setAttribute('data-resource-init-value', 'true');
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