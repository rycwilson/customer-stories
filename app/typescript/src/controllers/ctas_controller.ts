import { Controller } from '@hotwired/stimulus';

export default class CtasController extends Controller<HTMLDivElement> {
  connect() {
    console.log('connect ctas')
  }
}