import bootbox from 'bootbox';

export function actionsDropdownTemplate(displayStatus, rowData) {
  const noContributorsAdded = displayStatus.match(/0.+Contributors\sadded/);
  const noContributorsInvited = displayStatus.match(/0.+Contributors\sinvited/);
  const contributionsExist = displayStatus.match(/[^0]&nbsp;&nbsp;Contributions\ssubmitted/);
  const storyExists = rowData.story;
  const storyPath = storyExists && `/curate/${rowData.customer.slug}/${rowData.story.slug}`;
  const contributorsAction = (() => {
    const className = `${noContributorsAdded ? 'add' : 'manage'}-contributors`;
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

export function showContributions(e) {

  // Promise
  //   .all(contributionIds.map(id => fetch(`/contributions/${id}.json?get_submission=true`).then(res => res.json())))
  //   .then(contributions => {
  //     const modal = document.querySelector('.contributions-modal');
  //     const modalTitle = modal.querySelector('.modal-title');
  //     const modalBody = modal.querySelector('.modal-body');
  //     [modalTitle, modalBody].forEach(el => el.replaceChildren());
  //     modalTitle.innerText = 'Contributions and Feedback';
  //     modalBody.insertAdjacentHTML('afterbegin', contributionsTemplate(contributions));
  //     // setTimeout(() => $(modal).modal('show'));
  //     $(modal).modal('show');

  //     // if (contributionIds.length === contributions.length) {
  //     //   $('#contribution-content-modal .modal-content').empty().append(
  //     //     _.template($('#contribution-content-template').html())({ contributions, successId, formattedDate })
  //     //   );
  //     //   setTimeout(() => $('#contribution-content-modal').modal('show'));
  //     // }
  //   })
}

export function confirmDelete(row) {
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