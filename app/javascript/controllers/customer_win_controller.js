import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static outlets = ['contributors', 'contributions-modal'];
  static targets = ['actionsDropdown'];
  static values = { rowData: Object };

  id;
  status;
  customer;   // { id, name, slug }
  story;      // { id, title, slug }

  connect() {
    Object.keys(this.rowDataValue).forEach(field => this[field] = this.rowDataValue[field]);
    this.actionsDropdownTarget.insertAdjacentHTML('afterbegin', this.actionsDropdownTemplate());
  }

  storyExists() {
    return Boolean(this.story);
  }

  storyPath() {
    return this.storyExists() && `/curate/${this.customer.slug}/${this.story.slug}`;
  }

  addContributors() {
    this.dispatch('add-contributors', { detail: { successId: this.id } });
  }

  showContributions() {
    const contributionIds = this.contributorsOutlet.dt.data().toArray()
      .filter(contribution => (
        (contribution.success.id == this.id) && contribution.status && contribution.status.match(/(contribution|feedback)/)
      ))
      .map(contribution => contribution.id);
    Promise
      .all(contributionIds.map(id => fetch(`/contributions/${id}.json?get_submission=true`).then(res => res.json())))
      .then(contributions => {
        const modal = this.contributionsModalOutlet.element;
        const modalTitle = this.contributionsModalOutlet.titleTarget;
        const modalBody = this.contributionsModalOutlet.bodyTarget;
        [modalTitle, modalBody].forEach(el => el.replaceChildren());
        modalTitle.innerText = 'Contributions and Feedback';
        modalBody.insertAdjacentHTML('afterbegin', this.contributionsTemplate(contributions));
        $(modal).modal('show');
      })
  }
  
  // see also contributionTemplate in contributor_actions.js
  contributionsTemplate(contributions) {
    return `
      ${contributions.map((contribution, i) => `
          <section class="contribution">
            <h5 class="contribution__title">
              <span>${contribution.answers.length || contribution.contribution ? 'Contribution' : 'Feedback'}</span>
              &nbsp;&nbsp;&#8212;&nbsp;&nbsp;
              <span>submitted ${
                new Date(contribution.submitted_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
              }</span>
            </h5>
            <p>Invitation Template:&nbsp;&nbsp;${contribution.invitation_template.name}</p>
            <div class="contribution__contributor">
              <p>${contribution.contributor.full_name}</p>
              <p>${contribution.contributor.title || '<span style="color:#D9534F">No job title specified</span>'}</p>
              <!-- <p>${contribution.customer.name}</p> -->
            </div>
            ${contribution.answers.length ? `
              <ul>
                ${contribution.answers.sort((a,b) => a.contributor_question_id - b.contributor_question_id).map(answer => `
                    <li>
                      <p>${answer.question.question}</p>
                      <p><em>${answer.answer}</em></p>
                    </li>
                  `).join('')
                }
              </ul>
            ` : (
              contribution.contribution ?
                `<p><em>${contribution.contribution}</em></p>` :
                (contribution.feedback ? `<p><em>${contribution.feedback}</em></p>` : '')
            )}
          </section>
          ${i < contributions.length - 1 ? '<hr>' : ''}
        `).join('')
      }
    `;
  }

  actionsDropdownTemplate() {
    const noContributorsAdded = Boolean(this.status.match(/0.+Contributors\sadded/));
    const noContributorsInvited = Boolean(this.status.match(/0.+Contributors\sinvited/));
    const contributionsExist = Boolean(this.status.match(/[^0]&nbsp;&nbsp;Contributions\ssubmitted/));
    const action = noContributorsAdded ? 'Add' : (noContributorsInvited ? 'Invite' : 'Manage');
    return `
      <a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-caret-down"></i></a>
      <ul class="dropdown-menu dropdown-menu-right">
        ${contributionsExist ? `
            <li>
              <a href="javascript:;" data-action="customer-win#showContributions">
                <i class="fa fa-comments fa-fw action"></i>&nbsp;&nbsp;
                <span>View Contributions</span>
              </a>
            </li>
            <li class="divider" role="separator"></li>
          ` : 
          ''
        }
        ${this.storyExists() ? 
            [['story-settings', 'fa-gear'], ['story-content', 'fa-edit'], ['story-contributors', 'fa-users']]
              .map(([className, icon]) => {
                const section = (
                  className[className.indexOf('-') + 1].toUpperCase() + 
                  className.slice(className.indexOf('-') + 2, className.length)
                )
                return `
                  <li class="${className}">
                    <a href="${this.storyPath}">
                      <i class="fa ${icon} fa-fw action"></i>&nbsp;&nbsp;
                      <span>Customer Story ${section}</span>
                    </a>
                  </li>
                `;
              }).join('') : `
            <li>
              <a href="javascript:;" data-action="customer-win#${action.toLowerCase()}Contributors">
                <i class="fa fa-users fa-fw action"></i>&nbsp;&nbsp;
                <span>${action} Contributors</span>
              </a>
            </li>
            <li role="separator" class="divider"></li>
            <li class="start-curation">
              <a href="javascript:;">
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