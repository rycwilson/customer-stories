//= require ./contributor_invitation

function contributorActionsListeners () {
  $(document)
    .on('click', '[id*="contributors-table"] .view-contribution', showContribution)
    .on('click', '.contributor-actions .remove', confirmDelete);


  function showContribution(e) {
    const contributionId = e.target.closest('tr').dataset.contributionId;
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

  function confirmDelete(e) {
    const contributionId = e.target.closest('tr').dataset.contributionId;
    bootbox.confirm({
      size: 'small',
      className: 'confirm-remove-contributor',
      closeButton: false,
      message: "<i class='fa fa-warning'></i>\xa0\xa0\xa0<span>Are you sure?</span>",
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
      callback: (confirmed) => { if (confirmed) deleteContribution(contributionId); }
    });
  }

  async function deleteContribution(contributionId) {
    const csrfToken = document.querySelector('[name="csrf-token"]').content;
    const response = await fetch(`/contributions/${contributionId}`, { 
      method: 'DELETE', 
      headers: {
        'X-CSRF-Token': csrfToken
      } 
    });
    await response.text();  // console will report that fetch failed if the empty body is not read
    if (response.ok) {
      $('#prospect-contributors-table, #curate-contributors-table').each((i, table) => {
        $(table).DataTable().row(`[data-contribution-id="${contributionId}"]`).remove().draw();
  
        // if this was the only contribution under a group, remove the group
        $(table).find('tr.group').each((i, rowGroup) => {
          if ($(rowGroup).next().is('tr.group')) $(rowGroup).remove();
        });
      });
    }
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

  function formattedDate(date) {
    return moment(date).calendar(null, {
      sameDay: '[today]',
      lastDay: '[yesterday]',
      lastWeek: '['+ moment(date).fromNow() +']',
      sameElse: 'M/DD/YY'
    }).split('at')[0];
  }
}