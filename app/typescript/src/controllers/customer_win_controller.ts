import { Controller } from '@hotwired/stimulus';
import type ResourceController from './resource_controller.js';
import type ModalController from './modal_controller.js';
import { visit as turboVisit } from '@hotwired/turbo';
import { childRowPlaceholderTemplate } from '../customer_wins/win_story.js';
import Cookies from 'js-cookie';

export default class CustomerWinController extends Controller<HTMLTableRowElement> {
  static outlets = ['resource', 'modal'];
  declare readonly resourceOutlet: ResourceController;
  declare readonly modalOutlet: ModalController;

  static targets = ['actionsDropdown'];
  declare readonly actionsDropdownTarget: HTMLTableCellElement;

  static values = { 
    childRowTurboFrameAttrs: { type: Object, default: {} }, 
    rowData: Object 
  };
  declare readonly childRowTurboFrameAttrsValue: { id: string, src: string };
  declare readonly rowDataValue: { [key: string]: any };

  declare id: number;
  declare status: string;
  declare newStoryPath: string;
  declare curator: User;
  declare customer: Customer;
  declare story: Story | undefined;      

  declare contributionsHtml: string | undefined;          
  declare winStoryFormEl: HTMLFormElement | undefined;

  connect() {
    // console.log('connect customer win')
    Object.keys(this.rowDataValue).forEach(key => {
      const field: keyof this['rowDataValue'] = key;
      this[field] = this.rowDataValue[key];
    });
    this.actionsDropdownTarget.insertAdjacentHTML('afterbegin', this.actionsDropdownTemplate());
    this.element.id = `customer-win-${this.id}`;  // will be needed for win story outlet
  }

  get contributorsCtrl() {
    return this.resourceOutlet;
  }

  get childRowShown() {
    return this.element.classList.contains('dt-hasChild');
  }

  get hasChildRowContent() {
    return this.childRowTurboFrameAttrsValue.id && this.childRowTurboFrameAttrsValue.src;
  }

  get storyExists() {
    return Boolean(this.story);
  }

  get editStoryPath() {
    return this.storyExists ? `/stories/${this.story?.slug}/edit` : undefined;
  }

  toggleChildRow() {
    if (!this.hasChildRowContent) return false;
    const onFrameRendered = (e: Event) => (
      this.winStoryFormEl ??= (e.target as HTMLElement).firstElementChild as HTMLFormElement
    );
    const content = this.childRowShown ? null : (this.winStoryFormEl || `
      <turbo-frame id="${this.childRowTurboFrameAttrsValue.id}" src="${this.childRowTurboFrameAttrsValue.src}">
        ${childRowPlaceholderTemplate(this.curator?.full_name)}
      </turbo-frame>
    `);
    this.dispatch('toggle-child-row', { detail: { tr: this.element, content, onFrameRendered } });
  }

  // TODO: move template to the server
  // TODO: should occasionally check for new data? or set up an action cable
  showContributions() {
    const showInModal = () => {
      this.modalOutlet.titleValue = 'Contributions and Feedback';
      this.modalOutlet.bodyContentValue = this.contributionsHtml as string;
      this.modalOutlet.show();
    };
    if (this.contributionsHtml) showInModal();
    else {
      const contributionIds = this.contributorsCtrl.dt.data().toArray()
        .filter((contribution: Contribution) => (
          (contribution.success?.id == this.id) && contribution.status && /(contribution|feedback)/.test(contribution.status)
        ))
        .map((contribution: Contribution) => contribution.id);
      Promise
        .all(contributionIds.map((id: number) => fetch(`/contributions/${id}.json?get_submission=true`).then(res => res.json())))
        .then(contributions => {
          this.contributionsHtml = this.contributionsTemplate(contributions);
          showInModal();
        });
    }
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
  
  // see also contributionTemplate in contributor_actions.js
  contributionsTemplate(contributions: Contribution[]) {
    return `${
      contributions.map((_contribution, i) => {
        const { 
          contribution,
          feedback,
          submitted_at,
          answers,
          invitation_template,
          contributor,
          customer
        }: { 
          contribution?: string,
          feedback?: string,
          submitted_at?: string,
          answers?: ContributorAnswer[],
          invitation_template?: InvitationTemplate, 
          contributor?: User,
          customer?: Customer
        } = _contribution;
        return `
          <section class="contribution">
            <h5 class="contribution__title">
              <span>${answers?.length || contribution ? 'Contribution' : 'Feedback'}</span>
              &nbsp;&nbsp;&#8212;&nbsp;&nbsp;
              <span>submitted ${
                new Date(submitted_at as string).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
              }</span>
            </h5>
            <p>Invitation Template:&nbsp;&nbsp;${invitation_template?.name}</p>
            <div class="contribution__contributor">
              <p>${contributor?.full_name}</p>
              <p>${contributor?.title || '<span style="color:#D9534F">No job title specified</span>'}</p>
              <!-- <p>${customer?.name}</p> -->
            </div>
            ${answers?.length ? `
              <ul>
                ${answers.sort((a,b) => a.contributor_question_id - b.contributor_question_id).map(answer => `
                    <li>
                      <p>${answer.question.question}</p>
                      <p><em>${answer.answer}</em></p>
                    </li>
                  `).join('')
                }
              </ul>
            ` : (
              contribution ?
                `<p><em>${contribution}</em></p>` :
                (feedback ? `<p><em>${feedback}</em></p>` : '')
            )}
          </section>
          ${i < contributions.length - 1 ? '<hr>' : ''}
        `
      }).join('')
    }`;
  }

  actionsDropdownTemplate() {
    const status = this.status as string;
    const noContributorsAdded = /0.+Contributors\sadded/.test(status);
    const noContributorsInvited = /0.+Contributors\sinvited/.test(status);
    const contributionsExist = /[^0]&nbsp;&nbsp;Contributions\ssubmitted/.test(status);
    const action = noContributorsAdded ? 'Add' : (noContributorsInvited ? 'Invite' : '');
    // TODO: add the new invitation path
    const turboFrameAttrs = /Add|Invite/.test(action) && {
      id: `new-${action === 'Add' ? 'contribution' : 'invitation'}`,
      src: action === 'Add' ? `/successes/${this.id}/contributions/new` : '' 
    };
    return `
      <a id="customer-win-actions-dropdown-${this.id}" 
        href="#" 
        class="dropdown-toggle" 
        data-toggle="dropdown"
        aria-haspopup="true" 
        aria-expanded="false">
        <i class="fa fa-caret-down"></i>
      </a>
      <ul class="dropdown-menu dropdown-menu-right" aria-labelledby="customer-win-actions-dropdown-${this.id}">
        ${contributionsExist ? `
            <li>
              <a href="javascript:;" data-action="customer-win#showContributions">
                <i class="fa fa-comments fa-fw action"></i>&nbsp;&nbsp;
                <span>Contributions</span>
              </a>
            </li>
            <li class="divider" role="separator"></li>
          ` : 
          ''
        }
        ${this.storyExists ? 
            this.editStoryDropdownItems : `
            <li>
              <a href="javascript:;" 
                data-action="dashboard#${action.toLowerCase() || 'show'}CustomerWinContributors" 
                data-customer-win-id="${this.id}"
                data-turbo-frame-attrs=${JSON.stringify(turboFrameAttrs) || ''}>
                <i class="fa fa-users fa-fw action"></i>&nbsp;&nbsp;
                <span>${action} Contributors</span>
              </a>
            </li>
            <li role="separator" class="divider"></li>
            <li>
              <a 
                href="javascript:;"
                data-controller="modal-trigger"
                data-modal-trigger-modal-outlet="#main-modal"
                data-modal-trigger-title-value="New Customer Story"
                data-modal-trigger-turbo-frame-attrs-value=${JSON.stringify({ id: 'new-story', src: this.newStoryPath })}
                data-modal-trigger-submit-button-text-value="Add Story"
                aria-label="New Customer Story">
                <i class="fa fa-play fa-fw action"></i>&nbsp;&nbsp;
                <span>Start Customer Story</span>
              </a>
            </li>
          `
        }
        <li role="separator" class="divider"></li>
        <li class="delete-row">
          <a href="javascript:;">
            <i class="fa fa-remove fa-fw action"></i>&nbsp;&nbsp;
            <span>Remove</span>
          </a>
        </li>
      </ul>
    `;
  }
}