import { Controller } from '@hotwired/stimulus';
import { getJSON } from '../util';


export default class extends Controller {
  static values = { dataPath: String };

  stories;

  connect() {
    console.log('connect stories', this.dataPathValue)
    getJSON(this.dataPathValue).then(stories => {
      this.stories = stories;
      console.log('stories: ', this.stories);
    })
  }
}