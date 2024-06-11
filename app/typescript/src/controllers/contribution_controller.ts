import DatatableRowController from "./datatable_row_controller";
import type ModalController from './modal_controller';
import type { FrameElement } from '@hotwired/turbo';

export default class ContributionController extends DatatableRowController<ContributionController, ContributionRowData> {
  declare readonly modalOutlet: ModalController;

  static targets = [...DatatableRowController.targets, 'invitationTemplateSelect'];
  declare readonly invitationTemplateSelectTarget: TomSelectInput;

  declare id: number;
  declare status: string;
  declare contributor: User;
  declare invitationTemplate: InvitationTemplate;
  declare customerWin: CustomerWin;

  declare contributionHtml: HTMLElement;

  static connectCount: { [id: string]: number } = {};

  connect() {
    super.connect();
    
    ContributionController.connectCount[this.element.id] = ContributionController.connectCount[this.element.id] ?
      ++ContributionController.connectCount[this.element.id] : 
      1;
    console.log(
      ContributionController.connectCount[this.element.id], 
      'connect', 
      this.element.id, 
      Object.keys(ContributionController.connectCount).length
    )
  }
  
  onFrameRendered({ target: turboFrame }: {target: FrameElement}) {
    this.contributionHtml ??= <HTMLElement>turboFrame.firstElementChild;
  }
  
  initInvitationTemplateSelect() {  
    // new MutationObserver(mutations => {
    //   // mutation is the addition of the tom-select wrapper => the select has been initialized
    //   this.invitationTemplateSelectTarget.tomselect.setValue(this.invitationTemplate.id, true);
    //   this.disconnect();
    // }).observe(
    //   <HTMLTableCellElement>this.element.querySelector(':scope > td.invitation-template'), 
    //   { childList: true }
    // );
  }

  onChangeInvitationTemplate({ target: select }: { target: TomSelectInput }) {
    console.log('change template')
    const templateId = +select.value || null;
    fetch(`/contributions/${this.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': (<HTMLMetaElement>document.querySelector('[name="csrf-token"]')).content
      },
      body: JSON.stringify({ contribution: { invitation_template_id: templateId } }) 
    }).then(res => res.json())
      .then((template) => {
        this.invitationTemplate = template;
        super.updateRow({ invitation_template: template });
      })
  }
  
  get childRowContent() {
    return this.contributionHtml || '<h3>Contribution</h3>';
  }
}