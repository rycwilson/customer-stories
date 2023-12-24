import { Controller } from '@hotwired/stimulus';

export default class PluginsController extends Controller<HTMLDivElement> {
  connect() {
    console.log('connect plugins')
  }
}