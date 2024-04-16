import FormController from './form_controller';
import { initS3Upload } from '../user_uploads';
import { hexToRgb } from '../utils';

export default class CompanyProfileController extends FormController<CompanyProfileController> {
  connect() {
    // console.log('connect company profile')
    initS3Upload($(this.element));
  }

  onAjaxComplete({ detail: [xhr, status] }: { detail: [xhr: XMLHttpRequest, status: string] }) {
    const { company } = JSON.parse(xhr.response);
    if (status === 'OK') {
      // console.log('company:', company);
      if (company.previous_changes.logo_url) {
        const s3Data = JSON.parse(this.element.dataset.s3 as string);
        const { s3_direct_post: { fields: postData } } = JSON.parse(xhr.response);
        this.element.dataset.s3 = JSON.stringify({ ...s3Data, postData });
        initS3Upload($(this.element));
      }
    } else {
      // let FormController handle errors
    }
  }
}