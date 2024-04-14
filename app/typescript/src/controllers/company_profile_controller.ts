import { Controller } from '@hotwired/stimulus';
import FormController from './form_controller';
import { hexToRgb } from '../utils';

export default class CompanyProfileController extends FormController<CompanyProfileController> {
  connect() {
    console.log('connect company profile')
  }

  onAjaxComplete({ detail: [xhr, status] }: { detail: [xhr: XMLHttpRequest, status: string] }) {
    const { company, s3_direct_post: { fields: { key } } } = JSON.parse(xhr.response);
    if (status === 'OK') {
      console.log('company:', company);
      console.log('new upload key:', key);
    } else {
      // let FormController handle errors
    }
  }
}