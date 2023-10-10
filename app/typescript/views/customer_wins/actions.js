import bootbox from 'bootbox';

export function handleDropdownAction(target, row) {
  if (target.closest('.success-actions > .add-contributors')) {
    addContributors(row);
  } else if (target.closest('.success-actions > .view-contributions')) {
    showContributions(row.data().id);
  } else if (target.closest('.success-actions > .invite-contributors')) {
    showContributors(row);
  } else if (target.closest('.success-actions > .delete-row')) {
    deleteCustomerWin(row);
  }
}

export function actionsDropdownTemplate(displayStatus, rowData) {
  const noContributorsAdded = /0.+Contributors\sadded/.test(displayStatus);
  const noContributorsInvited = /0.+Contributors\sinvited/.test(displayStatus);
  const contributionsExist = /[^0]&nbsp;&nbsp;Contributions\ssubmitted/.test(displayStatus);
  const storyExists = rowData.story;
  const storyPath = storyExists && `/curate/${rowData.customer.slug}/${rowData.story.slug}`;
  const contributorsAction = (() => {
    const className = `${noContributorsAdded ? 'add' : 'invite'}-contributors`;
    const action = noContributorsAdded ? 'Add' : (noContributorsInvited ? 'Invite' : 'Manage');
    return `
      <li class="${className}">
        <a href="javascript:;">
          <i class="fa fa-users fa-fw action"></i>&nbsp;&nbsp;
          <span>${action} Contributors</span>
        </a>
      </li>
    `;
  })();
  return `
    <a href="javascript:;" class="dropdown-toggle" data-toggle="dropdown">
      <i class="fa fa-caret-down"></i>
    </a>
    <ul class="success-actions dropdown-menu dropdown-menu-right">
      ${contributionsExist ? `
          <li class="view-contributions">
            <a href="javascript:;">
              <i class="fa fa-comments fa-fw action"></i>&nbsp;&nbsp;
              <span>View Contributions</span>
            </a>
          </li>
          <li role="separator" class="divider"></li>
        ` : 
        ''
      }
      ${storyExists ? 
          [['story-settings', 'fa-gear'], ['story-content', 'fa-edit'], ['story-contributors', 'fa-users']]
            .map(([className, icon]) => {
              const section = (
                className[className.indexOf('-') + 1].toUpperCase() + 
                className.slice(className.indexOf('-') + 2, className.length)
              )
              return `
                <li class="${className}">
                  <a href="${storyPath}">
                    <i class="fa ${icon} fa-fw action"></i>&nbsp;&nbsp;
                    <span>Customer Story ${section}</span>
                  </a>
                </li>
              `;
            }).join('') : `
          ${contributorsAction}
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

function addContributors(row) {
  $(document).one('shown.bs.tab', 'a[href="#prospect-contributors"]', () => {
    $('#new-contributor-modal').modal('show');
    // $('select.new-contributor.customer').prop('disabled', true).val(customerId).trigger('change');
    // $('select.new-contributor.success').prop('disabled', true).val(successId).trigger('change');
  });
  showContributors(row);
}

function showContributors(row) {
  const successId = row.data().id;
  document.getElementById('contributors-filter').tomselect.setValue(`success-${successId}`);
  $(document).one('shown.bs.tab', 'a[href="#prospect-contributors"]', () => scrollTo(0, 65));
  $('a[href="#prospect-contributors"]').tab('show');
    
  // all filters enabled (nothing hidden)
  $('.contributors .checkbox-filter').prop('checked', true).trigger('change');
}

function showContributions(successId) {
  const contributionIds = $('#prospect-contributors-table').DataTable().data().toArray()
    .filter(contribution => (
      contribution.success.id == successId &&
      (contribution.status && /(contribution|feedback)/.test(contribution.status))
    ))
    .map(contribution => contribution.id);
  console.log('contributionIds', contributionIds)
  Promise
    .all(contributionIds.map(id => fetch(`/contributions/${id}.json?get_submission=true`).then(res => res.json())))
    .then(contributions => {
      console.log('contributions', contributions)
      const modal = document.querySelector('.contributions-modal');
      const modalTitle = modal.querySelector('.modal-title');
      const modalBody = modal.querySelector('.modal-body');
      [modalTitle, modalBody].forEach(el => el.replaceChildren());
      modalTitle.innerText = 'Contributions and Feedback';
      modalBody.insertAdjacentHTML('afterbegin', contributionsTemplate(contributions));
      // setTimeout(() => $(modal).modal('show'));
      $(modal).modal('show');

  //     // if (contributionIds.length === contributions.length) {
  //     //   $('#contribution-content-modal .modal-content').empty().append(
  //     //     _.template($('#contribution-content-template').html())({ contributions, successId, formattedDate })
  //     //   );
  //     //   setTimeout(() => $('#contribution-content-modal').modal('show'));
  //     // }
    })
}

// see also contributionTemplate in contributor_actions.js
function contributionsTemplate(contributions) {
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

function confirmDelete(row) {
  // TODO: check for associated Stories
  bootbox.confirm({
    size: 'small',
    className: 'confirm-remove-success',
    closeButton: false,
    message: '<i class="fa fa-warning"></i>&nbsp;&nbsp;&nbsp;<span>Are you sure?</span>',
    buttons: {
      confirm: {
        label: 'Remove',
        className: 'btn-danger'
      },
      cancel: {
        label: 'Cancel',
        className: 'btn-default'
      }
    },
    callback: (confirmed) => { if (confirmed) deleteSuccess(row) }
  });
}

async function deleteSuccess(row) {
  const csrfToken = document.querySelector('[name="csrf-token"]').content;
  const response = await fetch(`/successes/${row.data().id}`, { 
    method: 'DELETE', 
    headers: {
      'X-CSRF-Token': csrfToken
    } 
  });
  await response.text();  // console will report that fetch failed if the empty body is not read
  if (response.ok) row.remove().draw();
};