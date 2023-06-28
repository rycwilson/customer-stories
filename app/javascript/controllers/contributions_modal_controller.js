import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ['title', 'body'];

  connect() {

  //   $(this.element).on('shown.bs.dropdown', this.onShown.bind(this));
  //   $(this.element).on('hidden.bs.dropdown', this.onHidden.bind(this));
  }
  

}