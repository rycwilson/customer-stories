import { Controller } from '@hotwired/stimulus';

export default class StoryController extends Controller<HTMLDivElement> {
  static targets = [
    'titleInput',
    'narrativeTextarea',
    'contributions',
    'resultsList',
  ];
  declare readonly titleInputTargets: HTMLInputElement[];
  declare readonly narrativeTextareaTargets: HTMLTextAreaElement[];
  declare readonly contributionsTarget: HTMLDivElement;
  declare readonly resultsListTarget: HTMLUListElement;

  connect() {
    this.contributionsTarget.setAttribute('data-resource-init-value', 'true');
  }
}