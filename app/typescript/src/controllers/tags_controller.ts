import { Controller } from '@hotwired/stimulus';

export default class TagssController extends Controller<HTMLDivElement> {
  connect() {
    console.log('connect tags')
  }
}