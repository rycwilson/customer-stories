import bootbox from 'bootbox';

export function handleDropdownAction(target, row) {
  let dropdownItem;
  if (target.closest('.contributor-actions > .compose-invitation')) {

  } else if (target.closest('.contributor-actions > .resend-invitation')) {

  } else if (dropdownItem = target.closest('.contributor-actions > [class*="story-"]')) {
    e.preventDefault();
    Cookies.set('csp-edit-story-tab', `#${li.className}`);
    location = target.closest('a').href;
  } else if (target.closest('.contributor-actions > .completed')) {

  } else if (target.closest('.contributor-actions > .view-success')) {
    showCustomerWin(row.data().success.id);
  } else if (target.closest('.contributor-actions > .remove')) {

  }
}

export function showContribution(contributionId) {
  fetch(`/contributions/${contributionId}.json?get_submission=true`)
    .then(res => res.json())
    .then(contribution => {
      const modal = document.querySelector('.contributions-modal');
      const modalTitle = modal.querySelector('.modal-title');
      const modalBody = modal.querySelector('.modal-body');
      for (const el of [modalTitle, modalBody]) el.replaceChildren();
      modalTitle.insertAdjacentHTML(
        'afterbegin', `Contribution &#8212; submitted ${formattedDate(contribution.submitted_at)}`
      );
      modalBody.insertAdjacentHTML('afterbegin', contributionTemplate(contribution));
      // setTimeout(() => $(modal).modal('show'));
      $(modal).modal('show')
    })
}

export function actionsDropdownTemplate(status, rowData, workflowStage) {
  const isPreInvite = rowData.status === 'pre_request';
  const invitationTemplate = rowData.invitation_template;
  const didNotRespond = rowData.status === 'did_not_respond';
  const wasSubmitted = rowData.status && rowData.status.includes('submitted');
  const story = rowData.success.story;
  const viewStoryPath = story && story.csp_story_path;
  const editStoryPath = story && `/curate/${rowData.success.customer.slug}/${rowData.success.story.slug}`;
  const storyActions = [['story-settings', 'fa-gear'], ['story-content', 'fa-edit'], ['story-contributors', 'fa-users']]
    .map(([className, icon]) => {
      const section = (
        className[className.indexOf('-') + 1].toUpperCase() + 
        className.slice(className.indexOf('-') + 2, className.length)
      )
      return `
        <li class="${className}">
          <a href="${editStoryPath}">
            <i class="fa ${icon} fa-fw action"></i>&nbsp;&nbsp;
            <span>Customer Story ${section}</span>
          </a>
        </li>
      `;
    }).join('');
  return `
    <a href="javascript:;" class="dropdown-toggle" data-toggle='dropdown'>
      <i class="fa fa-caret-down"></i>
    </a>
    <ul class="contributor-actions dropdown-menu dropdown-menu-right dropdown-actions">
      <li class="${isPreInvite ? `compose-invitation ${invitationTemplate ? '' : 'disabled'}` : 'view-request'}">
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
      ${workflowStage === 'prospect' ? `
          ${story && story.published ? `
              <li>
                <a href="${viewStoryPath}"}>
                  <i class="fa fa-search fa-fw action"></i>&nbsp;&nbsp;
                  <span>View Story</span>
                </a>
              </li>
              <li role="separator" class="divider"></li>
            ` : ''
          }
          ${story ? storyActions : `
              <li class="view-success">
                <a href="javascript:;"}>
                  <i class="fa fa-rocket fa-fw action"></i>&nbsp;&nbsp;
                  <span>View Customer Win</span>
                </a>
              </li>
            `
          }
          <li role="separator" class="divider"></li>
        ` : ''
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

function showCustomerWin(successId) {
  document.getElementById('successes-filter').tomselect.setValue(`success-${successId}`);
  const tr = document.getElementById('successes-table').querySelector('tr:last-of-type');
  const toggleChildRowBtn = tr.children[0].children[0];
  $(document).one('shown.bs.tab', 'a[href="#customer-wins"]', () => {
    scrollTo(0,0);
    toggleChildRowBtn.click();
  });
  // $('a[href="#successes"]').tab('show');
  $('a[href="#customer-wins"]').tab('show');
}

// see also contributionsTemplate in success_actions.js
function contributionTemplate(contribution) {
  return `
    <section class="contribution">
      <div class="contribution__contributor">
        <p>${contribution.contributor.full_name}</p>
        <p>${contribution.contributor.title || '<span style="color:#D9534F">No job title specified</span>'}</p>
        <p>${contribution.customer.name}</p>
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
        )
      }
    </section>
  `;
}