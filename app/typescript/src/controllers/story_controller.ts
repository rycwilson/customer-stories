import { Controller } from '@hotwired/stimulus';

export default class StoryController extends Controller<HTMLDivElement> {
  static targets = [
    'narrativeTextarea',
    'contributions',
  ];
  declare readonly narrativeTextareaTargets: HTMLTextAreaElement[];
  declare readonly contributionsTarget: HTMLDivElement;

  connect() {
    this.contributionsTarget.setAttribute('data-resource-init-value', 'true');
  }
}