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

  connect() {
    super.connect();
    // console.log('connect contribution', this.id)
    if (this.invitationTemplate) {
      this.invitationTemplateSelectTarget.value = this.invitationTemplate.id;
      // this.initInvitationTemplateSelect();
    }
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
  
  get childRowContent() {
    return this.contributionHtml || '<h3>Contribution</h3>';
  }

  get storyExists() {
    return Boolean(this.customerWin.story);
  }

  get editStoryPath() {
    return this.storyExists ? `/stories/${this.customerWin.story.slug}/edit` : undefined;
  }

  get viewStoryDropdownItem() {
    if (!this.storyExists) return '';
    return `
      <li>
        <a href="${this.customerWin.story.csp_story_path}" data-turbo="false" target="_blank" rel="noopener">
          <i class="fa fa-search fa-fw action"></i>&nbsp;&nbsp;
          <span>View Story</span>
        </a>
      </li>
    `;
  }

  get editStoryDropdownItems() {
    return [['story-settings', 'fa-gear'], ['story-content', 'fa-edit'], ['story-contributors', 'fa-users']]
      .map(([tab, icon]) => {
        const section = tab[tab.indexOf('-') + 1].toUpperCase() + tab.slice(tab.indexOf('-') + 2, tab.length);
        return `
          <li class="${tab}">
            <a href="javascript:;" data-action="dashboard#editStory" data-story-path="${this.editStoryPath}" data-story-tab="${tab}">
              <i class="fa ${icon} fa-fw action"></i>&nbsp;&nbsp;
              <span>Customer Story ${section}</span>
            </a>
          </li>
        `;
      })
      .join('');
  }

  get viewCustomerWinDropdownItem() {
    return `
      <li class="view-success">
        <a href="javascript:;"}>
          <i class="fa fa-rocket fa-fw action"></i>&nbsp;&nbsp;
          <span>View Customer Win</span>
        </a>
      </li>
    `;
  }

  get actionsDropdownTemplate() {
    const shouldShowStoryLinks = window.location.pathname === '/prospect';
    const isPreInvite = this.status === 'pre_request';
    const didNotRespond = this.status === 'did_not_respond';
    const wasSubmitted = this.status && this.status.includes('submitted');
    return `
      <a id="contributors-action-dropdown-${this.id}" 
        href="#" 
        class="dropdown-toggle" 
        data-toggle="dropdown"
        aria-haspopup="true" 
        aria-expanded="false">
        <i class="fa fa-caret-down"></i>
      </a>
      <ul class="contributor-actions dropdown-menu dropdown-menu-right" aria-labelledby="contributors-action-dropdown-${this.id}">
        <li class="${isPreInvite ? `compose-invitation ${this.invitationTemplate ? '' : 'disabled'}` : 'view-request'}">
          <a href="javascript:;">
            <i class="fa fa-${isPreInvite ? 'envelope' : 'search'} fa-fw action"></i>&nbsp;&nbsp;
            <span>${isPreInvite ? 'Compose Invitation' : 'View Sent Invitation'}</span>
          </a>
        </li>
        ${didNotRespond ? `
            <li class="resend-invitation">
              <a href="javascript:;">
                <i class="fa fa-envelope fa-fw action"></i>&nbsp;&nbsp;
                <span>Re-send Invitation</span>
              </a>
            </li>
          ` : ''
        }
        ${wasSubmitted ? `
            <li class="completed">
              <a href="javascript:;">
                <i class="fa fa-check fa-fw action"></i>&nbsp;&nbsp;
                <span>Mark as completed</span>
              </a>
            </li>
          ` : ''
        }
        <li role="separator" class="divider"></li>
        ${shouldShowStoryLinks ? `
            ${this.customerWin.story?.published ? 
                this.viewStoryDropdownItem + '<li role="separator" class="divider"></li>' : 
                ''
            }
            ${this.storyExists ? this.editStoryDropdownItems : this.viewCustomerWinDropdownItem}
            <li role="separator" class="divider"></li>
          ` : 
          ''
        }
        <li class="remove">
          <a href="javascript:;">
            <i class="fa fa-remove fa-fw action"></i>&nbsp;&nbsp;
            <span>Remove</span>
          </a>
        </li>
      </ul>
    `;
  }

}