import { Controller } from '@hotwired/stimulus';

export default class CompanyProfileController extends Controller<HTMLFormElement> {
  connect() {
    console.log('connect company profile')
  }
}