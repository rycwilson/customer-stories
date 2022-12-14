function successActionsListeners () {
  $(document)
    .on('click', '.success-actions .add-contributors', addContributors)
    .on('click', '.success-actions .manage-contributors', manageContributors)
    .on('click', '.success-actions .view-submissions', showContributions)
    .on('click', '.success-actions [class^="story-"]', (e) => {
      e.preventDefault();
      Cookies.set('csp-edit-story-tab', `#${e.currentTarget.classList[0]}`);
      window.location = e.currentTarget.querySelector('a').href;
    })
    .on('click', '.success-actions .remove', confirmDelete);

  function addContributors(e) {
    const customerId = e.target.closest('tr').dataset.customerId;
    const successId = e.target.closest('tr').dataset.successId;
    $('a[href="#prospect-contributors"]').tab('show');
    $('#contributors-filter').val(`success-${successId}`).trigger('change');
    $('#new-contributor-modal').modal('show');
    $('select.new-contributor.customer').prop('disabled', true).val(customerId).trigger('change');
    $('select.new-contributor.success').prop('disabled', true).val(successId).trigger('change');
  }

  function manageContributors(e) {
    const successId = e.target.closest('tr').dataset.successId;
    $('#contributors-filter').val(`success-${successId}`).trigger('change');
    $('#contributors-filter').next('.select2').addClass('select2-container--focus');
    $(document)
      .one('click', (e) => $('#contributors-filter').next().removeClass('select2-container--focus'))
      .one('shown.bs.tab', 'a[href="#prospect-contributors"]', (e) => $('html, body').animate({ scrollTop: 65 }, 200))
    $('a[href="#prospect-contributors"]').tab('show');
      
    // for a filtered view, default to checkbox filters all applied (nothing hidden)
    $('.contributors.checkbox-filter input').prop('checked', true).trigger('change');
  }

  function showContributions(e) {
    const successId = e.target.closest('tr').dataset.successId;

    // can't search on successId given current setup of the table data
    const contributionIds = $('#prospect-contributors-table').DataTable().rows().data().toArray()
      .filter(contribution => (
        contribution.success.id == successId &&
        (contribution.status && contribution.status.match(/(contribution|feedback)/))
      ))
      .map(contribution => contribution.id);
    Promise
      .all(contributionIds.map(id => fetch(`/contributions/${id}.json?get_submission=true`).then(res => res.json())))
      .then(contributions => {
        const modal = document.querySelector('.contributions-modal');
        const modalTitle = modal.querySelector('.modal-title');
        const modalBody = modal.querySelector('.modal-body');
        [modalTitle, modalBody].forEach(el => el.replaceChildren());
        modalTitle.innerText = 'Contributions and Feedback';
        modalBody.insertAdjacentHTML('afterbegin', contributionsTemplate(contributions));
        // setTimeout(() => $(modal).modal('show'));
        $(modal).modal('show');

        // if (contributionIds.length === contributions.length) {
        //   $('#contribution-content-modal .modal-content').empty().append(
        //     _.template($('#contribution-content-template').html())({ contributions, successId, formattedDate })
        //   );
        //   setTimeout(() => $('#contribution-content-modal').modal('show'));
        // }
      })
  }

  function confirmDelete(e) {
    const successId = e.target.closest('tr').dataset.successId;
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
      callback: (confirmed) => { if (confirmed) deleteSuccess(successId) }
    });
  }

  async function deleteSuccess(successId) {
    const csrfToken = document.querySelector('[name="csrf-token"]').content;
    const response = await fetch(`/successes/${successId}`, { 
      method: 'DELETE', 
      headers: {
        'X-CSRF-Token': csrfToken
      } 
    });
    await response.text();  // console will report that fetch failed if the empty body is not read
    if (response.ok) {
      $('#successes-table').DataTable().row(`[data-success-id="${successId}"]`).remove().draw();

      // if this was the only success under a group, remove the group
      $(table).find('tr.group').each((i, rowGroup) => {
        if ($(rowGroup).next().is('tr.group')) $(rowGroup).remove();
      });
    }
  };

  // see also contributionTemplate in contributor_actions.js
  function contributionsTemplate(contributions) {
    return `
      ${contributions.map((contribution, i) => `
          <section class="contribution">
            <h5 class="contribution__title">
              <span>${contribution.answers.length || contribution.contribution ? 'Contribution' : 'Feedback'}</span>
              &nbsp;&nbsp;&#8212;&nbsp;&nbsp;
              <span>submitted ${formattedDate(new Date(contribution.submitted_at))}</span>
            </h5>
            <p>Invitation Template:&nbsp;&nbsp;${contribution.invitation_template.name}</p>
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
            )}
          </section>
          ${i < contributions.length - 1 ? '<hr>' : ''}
        `).join('')
      }
    `;
  }

  function formattedDate(date) {
    return moment(date).calendar(null, {
      sameDay: '[today]',
      lastDay: '[yesterday]',
      lastWeek: '['+ moment(date).fromNow() +']',
      sameElse: 'M/DD/YY'
    }).split('at')[0];
  }
}