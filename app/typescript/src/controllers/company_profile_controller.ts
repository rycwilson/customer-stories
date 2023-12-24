import { Controller } from '@hotwired/stimulus';
import { hexToRgb } from '../utils';

export default class CompanyProfileController extends Controller<HTMLFormElement> {
  connect() {
    console.log('connect company profile')
  }
}