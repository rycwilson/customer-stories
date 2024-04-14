import { Controller } from '@hotwired/stimulus';
import FormController from './form_controller';
import { hexToRgb } from '../utils';

export default class CompanyProfileController extends FormController<CompanyProfileController> {
  connect() {
    console.log('connect company profile')
  }
}