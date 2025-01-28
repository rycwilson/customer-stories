import { Controller } from "@hotwired/stimulus";
import { bsToast } from "../utils";

export default class extends Controller {
  static values = {
    toast: { type: Object, default: {} }
  };
  declare toastValue: { type?: 'info' | 'success' | 'warning' | 'danger', message?: string };

  toastValueChanged(newVal: { type?: string, message?: string }) {
    const { type, message } = newVal;
    if (type && message) {
      bsToast(type, message);
      this.toastValue = {};
    }
  }
}