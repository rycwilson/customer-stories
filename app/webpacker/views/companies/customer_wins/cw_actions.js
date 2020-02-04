
import { editStory } from '../prospect';
import cwTable from './cw_table';

export function addListeners() {
  $(document)
    .on('click', '.success-actions .manage-contributors', viewContributors)
    .on('click', '.success-actions .view-submissions', viewSubmissions)
    .on('click', '.success-actions .add-contributor', showNewContributorForm)
    .on(
      'click',
      `.success-actions .story-settings, 
       .success-actions .story-content, 
       .success-actions .story-contributors`,
      editStory
    )
    .on('click', '.success-actions .remove', deleteCustomerWin);
}

function viewContributors(e) {
  const successId = $(this).closest('tr').data('success-id');
  $('#contributors-filter').val(`success-${ successId }`).trigger('change');
  $('#contributors-filter').select2('focus');
  $(document)
    .one('click', () => {
      $('#contributors-filter').next().removeClass('select2-container--focus');
    })
    .one('shown.bs.tab', 'a[href="#prospect-contributors"]', () => {
      $('html, body').animate({ scrollTop: 65 }, 200);
    });
  $('a[href="#prospect-contributors"]').tab('show');
  // for a filtered view, default to checkbox filters all applied (nothing hidden)
  $('.contributors.checkbox-filter input').prop('checked', true).trigger('change');
}

function viewSubmissions() {
  // TODO: don't use a modal for this
  // const successId = $(this).closest('tr').data('success-id');
  // const contributions = [];

  // // can't search on successId given current setup of the table data
  // const contributionIds = $('#contributors-table').DataTable().rows().data().toArray()
  //   .filter((contribution) => (
  //     contribution.success.id == successId &&
  //     (contribution.status && contribution.status.match(/(contribution|feedback)/))
  //   ))
  //   .map((contribution) => contribution.id);

  // contributionIds.forEach((id) => {
  //   $.ajax({
  //     url: `/contributions/${ id }`,
  //     method: 'get',
  //     data: {
  //       get_submission: true
  //     },
  //     dataType: 'json'
  //   })
  //     .done((contribution, status, xhr) => {
  //       contributions.push(contribution);
  //       if (contributionIds.length === contributions.length) {
  //         showSuccessContributions(successId, contributions);
  //       }
  //     });
  // })
}

function showNewContributorForm(e) {
  const $tr = $(this).closest('tr');
  const customerId = $tr.data('customer-id');
  const successId = $tr.data('success-id');
  $('a[href="#prospect-contributors"]').tab('show');
  $('#contributors-filter').val(`success-${ successId }`).trigger('change');
  $('#new-contributor-modal').modal('show');
  $('select.new-contributor.customer')
    .prop('disabled', true)
    .val(customerId)
    .trigger('change');
  $('select.new-contributor.success')
    .prop('disabled', true)
    .val(successId)
    .trigger('change');
}

function deleteCustomerWin(e) {
  const cwId = $(this).closest('tr').data('success-id');
  $.ajax({
    url: `/successes/${ cwId }`,
    method: 'delete',
    dataType: 'json'
  })
    .done((cw, status, xhr) => cwTable.remove(cwId));
  // bootbox.confirm({
  //   size: 'small',
  //   className: 'confirm-remove-success',
  //   closeButton: false,
  //   message: "<i class='fa fa-warning'></i>\xa0\xa0\xa0<span>Are you sure?</span>",
  //   buttons: {
  //     confirm: {
  //       label: 'Remove',
  //       className: 'btn-danger'
  //     },
  //     cancel: {
  //       label: 'Cancel',
  //       className: 'btn-default'
  //     }
  //   },
  //   callback: function (confirmRemove) {
  //     if (confirmRemove) { removeSuccess(successId); }
  //   }
  // });
}

export function actionsDropdownTemplate(status, story, storyPath) {
  return `
    <a href="javascript:;" class="dropdown-toggle" data-toggle="dropdown">
      <i class="fa fa-caret-down"></i>
    </a>
    <ul class="success-actions dropdown-menu dropdown-menu-right dropdown-actions">
      ${ statusBasedActions(status, story, storyPath) }
      <li role="separator" class="divider"></li>
      <li class="remove">
        <a href="javascript:;">
          <i class="fa fa-remove fa-fw action"></i>&nbsp;&nbsp;
          <span>Delete</span>
        </a>
      </li>
    </ul>
  `
}

function statusBasedActions(status, story, storyPath) {
  let actions = '';
  if ( status.match(/[^0]&nbsp;&nbsp;Contributions\ssubmitted/) ) { 
    actions = actions.concat(`
      <li class="view-submissions">
        <a href="javascript:;">
          <i class="fa fa-comments fa-fw action"></i>&nbsp;&nbsp;
          <span>View Contributions</span>
        </a>
      </li>
      <li role="separator" class="divider"></li>
    `);
  }
  if (story) {
    actions = actions.concat(`
      <li class="story-settings">
        <a href="${ storyPath }">
          <i class="fa fa-gear fa-fw action"></i>&nbsp;&nbsp;
          <span>Customer Story Settings</span>
        </a>
      </li>
      <li class="story-content">
        <a href="${ storyPath }">
          <i class="fa fa-edit fa-fw action"></i>&nbsp;&nbsp;
          <span>Customer Story Content</span>
        </a>
      </li>
      <li class="story-contributors">
        <a href="${ storyPath }">
          <i class="fa fa-users fa-fw action"></i>&nbsp;&nbsp;
          <span>Customer Story Contributors</span>
        </a>
      </li>
    `)
  } else { 
    if ( status.match(/0.+Contributors\sadded/) ) { 
      actions = actions.concat(`
        <li class="add-contributor">
          <a href="javascript:;">
            <i class="fa fa-users fa-fw action"></i>&nbsp;&nbsp;
            <span>Add Contributors</span>
          </a>
        </li>
      `);
    } else if ( status.match(/0.+Contributors\sinvited/) ) {
      actions = actions.concat(`
        <li class="manage-contributors">
          <a href="javascript:;">
            <i class="fa fa-users fa-fw action"></i>&nbsp;&nbsp;
            <span>Invite Contributors</span>
          </a>
        </li>
      `);
    } else { 
      actions = actions.concat(`
        <li class="manage-contributors">
          <a href="javascript:;">
            <i class="fa fa-users fa-fw action"></i>&nbsp;&nbsp;
            <span>Manage Contributors</span>
          </a>
        </li>
      `)
    }
    actions = actions.concat(`
      <li role="separator" class="divider"></li>
      <li class="start-curation">
        <a href="javascript:;">
          <i class="fa fa-play fa-fw action"></i>&nbsp;&nbsp;
          <span>Start Customer Story</span>
        </a>
      </li>
    `)
  }
  return actions;
}
