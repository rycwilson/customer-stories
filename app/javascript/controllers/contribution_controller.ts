import { Controller } from "@hotwired/stimulus";

export default class extends Controller<HTMLTableRowElement> {
  static targets = ['actionsDropdown'];
  static values = { rowData: Object, workflowStage: { type: String, default: 'prospect' } };

  id: number | undefined = undefined;
  status: string | undefined = undefined;
  contributor: object | undefined = undefined;
  invitationTemplate;
  customerWin;

  // contribution;

  initialize() {}
  
  connect() {
    // console.log('connect contribution')
    Object.keys(this.rowDataValue).forEach(field => this[field] = this.rowDataValue[field]);
    this.actionsDropdownTarget.insertAdjacentHTML('afterbegin', this.actionsDropdownTemplate());
  }

  storyExists() {
    return Boolean(this.customerWin.story);
  }

  storyPath() {
    return this.storyExists() && this.customerWin.story.csp_story_path;
  }

  editStoryPath() {
    return this.storyExists() && `/curate/${this.customerWin.customer.slug}/${this.customerWin.story.slug}`;
  }

  actionsDropdownTemplate() {
    const isPreInvite = this.status === 'pre_request';
    const didNotRespond = this.status === 'did_not_respond';
    const wasSubmitted = this.status && this.status.includes('submitted');
    const storyActions = [['story-settings', 'fa-gear'], ['story-content', 'fa-edit'], ['story-contributors', 'fa-users']]
      .map(([className, icon]) => {
        const section = (
          className[className.indexOf('-') + 1].toUpperCase() + 
          className.slice(className.indexOf('-') + 2, className.length)
        )
        return `
          <li class="${className}">
            <a href="${this.editStoryPath()}">
              <i class="fa ${icon} fa-fw action"></i>&nbsp;&nbsp;
              <span>Customer Story ${section}</span>
            </a>
          </li>
        `;
      }).join('');
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
        ${this.workflowStageValue === 'prospect' ? `
            ${this.storyExists() && this.customerWin.story.published ? `
                <li>
                  <a href="${this.storyPath()}"}>
                    <i class="fa fa-search fa-fw action"></i>&nbsp;&nbsp;
                    <span>View Story</span>
                  </a>
                </li>
                <li role="separator" class="divider"></li>
              ` : ''
            }
            ${this.storyExists() ? storyActions : `
                <li class="view-success">
                  <a href="javascript:;"}>
                    <i class="fa fa-rocket fa-fw action"></i>&nbsp;&nbsp;
                    <span>View Customer Win</span>
                  </a>
                </li>
              `
            }
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