import { Controller } from '@hotwired/stimulus';

export default class TagsController extends Controller<HTMLDivElement> {
  connect() {
    console.log('connect tags')
  }
}