import DatatableRowController from './datatable_row_controller';
import type ModalController from './modal_controller';
import { actionsDropdownTemplate } from '../customer_wins/customer_wins';

export default class CustomerWinController extends DatatableRowController<CustomerWinController, CustomerWinRowData> {
  declare readonly modalOutlet: ModalController;

  declare contributionsHtml: string;          

  get childRowContent() {
    return this.childRowElement || `
      <turbo-frame id="${this.childRowTurboFrameAttrsValue.id}" src="${this.childRowTurboFrameAttrsValue.src}">
      </turbo-frame>
    `;
  }

  get actionsDropdownHtml() {
    return actionsDropdownTemplate(this.rowDataValue);
  }

  // TODO: move template to the server
  // TODO: should occasionally check for new data? or set up an action cable
  showContributions() {
    const showInModal = () => {
      // this.modalOutlet.titleValue = 'Contributions and Feedback';
      // this.modalOutlet.bodyContentValue = this.contributionsHtml as string;
      // this.modalOutlet.show();
    };
    if (this.contributionsHtml) showInModal();
    else {
      // const contributionIds = this.contributionsCtrl.dt.data().toArray()
      const contributionIds = (CSP['contributions'] as Contribution[])
        .filter((contribution: Contribution) => (
          (contribution.customer_win?.id == this.rowDataValue.id) && contribution.status && /(contribution|feedback)/.test(contribution.status)
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
}