// import { Controller } from '@hotwired/stimulus';
import FormController from './form_controller';

export default class ContributorInvitationController extends FormController<ContributorInvitationController> {
  static targets = ['recipient', 'subject', 'body'];
  declare readonly recipientTarget: HTMLInputElement;
  declare readonly subjectTarget: HTMLInputElement;
  declare readonly bodyTarget: HTMLTextAreaElement;
}