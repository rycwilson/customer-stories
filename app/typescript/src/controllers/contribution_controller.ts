import DatatableRowController from "./datatable_row_controller";
import type ModalController from './modal_controller';
import { actionsDropdownTemplate } from '../contributions/contributions';

export default class ContributionController extends DatatableRowController<ContributionController, ContributionRowData> {
  declare readonly modalOutlet: ModalController;

  static targets = [...DatatableRowController.targets, 'invitationTemplateSelect'];
  declare readonly invitationTemplateSelectTarget: TomSelectInput;

  get childRowContent() {
    return this.childRowElement || `
      <turbo-frame id="${this.childRowTurboFrameAttrsValue.id}" src="${this.childRowTurboFrameAttrsValue.src}">
        <p>Loading...</p>
      </turbo-frame>
    `;
  }

  get actionsDropdownHtml() {
    return actionsDropdownTemplate(this.rowDataValue);
  }

  // initInvitationTemplateSelect() {  
    // new MutationObserver(mutations => {
    //   // mutation is the addition of the tom-select wrapper => the select has been initialized
    //   this.invitationTemplateSelectTarget.tomselect.setValue(this.invitationTemplate.id, true);
    //   this.disconnect();
    // }).observe(
    //   <HTMLTableCellElement>this.element.querySelector(':scope > td.invitation-template'), 
    //   { childList: true }
    // );
  // }

  onChangeInvitationTemplate({ target: select }: { target: TomSelectInput }) {
    const templateId = +select.value || null;
    fetch(this.rowDataValue.path, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': (<HTMLMetaElement>document.querySelector('[name="csrf-token"]')).content
      },
      body: JSON.stringify({ contribution: { invitation_template_id: templateId } }) 
    }).then(res => res.json())
      .then((template) => {
        this.rowDataValue.invitationTemplate = template;
        super.updateRow({ invitation_template: template });
      });
  }

  markAsCompleted() {
    const newStatus = `${this.rowDataValue.status.includes('contribution') ? 'contribution' : 'feedback'}_completed`;
    fetch(`/contributions/${this.rowDataValue.id}`, { 
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': (<HTMLMetaElement>document.querySelector('[name="csrf-token"]')).content
      },
      body: JSON.stringify({ contribution: { status: newStatus } }) 
    }).then(res => res.json())
      .then(contribution => {
        this.rowDataValue.status = contribution.status;
        super.updateRow({ status: contribution.status, display_status: contribution.display_status });

        // TODO Per display options for the table, hide this row if completed contributions are to be hidden
      });
  }

  deleteRow() {
    return super.deleteRow().then(() => {
      CSP.contributions = CSP.contributions!.filter(contribution => (
        contribution.id !== this.rowDataValue.id
      ));
      let storyContributions = this.rowDataValue.story ? 
        CSP.storyContributions[this.rowDataValue.story.id] : 
        undefined;
      if (storyContributions) {
        storyContributions = storyContributions.filter(contribution => (
          contribution.id !== this.rowDataValue.id
        ));
      }
    });
  }
}