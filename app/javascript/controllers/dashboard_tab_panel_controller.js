import { Controller } from "@hotwired/stimulus"

export default class DashboardTabPanelController extends Controller {
  initialize() {
    console.log('initialize panel: ', this.element.id)
  }
  connect() {
  }
}
