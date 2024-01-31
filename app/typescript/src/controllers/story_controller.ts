import { Controller } from '@hotwired/stimulus';
import Cookies from 'js-cookie';

export default class StoryController extends Controller<HTMLDivElement> {
  static targets = ['storySettingsForm', 'storyContentForm'];
  declare readonly storySettingsFormTarget: HTMLFormElement;
  declare readonly storyContentFormTarget: HTMLFormElement;

  connect() {
    console.log('connect story')
    this.storySettingsFormTarget.setAttribute('data-init', 'true');
  }
}