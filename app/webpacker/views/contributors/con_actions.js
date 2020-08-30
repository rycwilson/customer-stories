import 'moment';
import { editStory } from '../dashboard/prospect';
import dataTable from './data_table';

export function addListeners() {
  $(document)
    // BEWARE this will also fire from Successes view
    .on(
      'click', 
      '.contributor-actions .view-contribution, td.status .view-contribution', 
      viewContribution
    )
    .on('click', '.contributor-actions .view-success', viewCustomerWin)
    .on(
      'click',
      `.contributor-actions .story-settings, 
       .contributor-actions .story-content, 
       .contributor-actions .story-contributors`,
      editStory
      )
    .on('click', '.contributor-actions .completed', markAsCompleted)
    .on('click', '.contributor-actions .remove', deleteContributor);
}

// TODO - show in the child row instead of modal
function viewContribution(e) {
  // const contributionId = $(this).closest('tr').data('contribution-id');  
  // $.ajax({
  //   url: contributionPath(contributionId),
  //   method: 'get',
  //   data: {
  //     get_submission: true
  //   },
  //   dataType: 'json'
  // })
  //   .done(function (contribution, status, xhr) {
  //     $.when(
  //       $('#contribution-content-modal .modal-content').empty().append(
  //         _.template( $('#contribution-content-template').html() )({
  //           contributions: [contribution],
  //           successId: null,
  //           formattedDate: formattedDate
  //         })
  //       )
  //     )
  //       .done(function () {
  //         $('#contribution-content-modal').modal('show');
  //       });
  //   });
}

function viewCustomerWin() {
  const cwId = $(this).closest('tr').data('success-id');
  $('#successes-filter').val(`success-${ cwId }`).trigger('change');
  $('#successes-filter').select2('focus');
  $(document)
    .one('click', (e) => {
      $('#successes-filter').next().removeClass('select2-container--focus');
    })
    .one('shown.bs.tab', 'a[href="#successes"]', (e) => {
      $('html, body').animate({ scrollTop: 65 }, 200);
    });
  $('a[href="#successes"]').tab('show');
}

// TODO
function markAsCompleted(e) {
  // var dt = $(this).closest('table').DataTable(),
  //     $row = $(this).closest('tr'),
  //     rowData = dt.row($row).data(),
  //     $tdStatus = $row.find('td.status'),
  //     contributionId = $row.data('contribution-id');
  // $.ajax({
  //   url: contributionPath(contributionId),
  //   method: 'put',
  //   data: { completed: true },
  //   dataType: 'json'
  // })
  //   .done(function (data, status, xhr) {
  //     rowData.status = data.status;
  //     rowData.display_status = data.display_status;
  //     dt.row($row).data(rowData);
  //     $tdStatus.find('i').toggle();
  //     setTimeout(function () {
  //       $tdStatus.find('i').toggle();
  //     }, 2000);
  //     setTimeout(function () {
  //       if ( $('#show-completed').length &&
  //            $('#show-completed').prop('checked') === false ) {
  //         $('#show-completed').trigger('change');
  //       }
  //     }, 2200);
  //   });
}

function deleteContributor(e) {
  const contributionId = $(this).closest('tr').data('contribution-id');
  $.ajax({
    url: `/contributions/${ contributionId }`,
    method: 'delete',
    dataType: 'json'
  })
    .done((contribution, status, xhr) => dataTable.remove(contributionId));
  //  bootbox.confirm({
  //    size: 'small',
  //    className: 'confirm-remove-contributor',
  //    closeButton: false,
  //    message: "<i class='fa fa-warning'></i>\xa0\xa0\xa0<span>Are you sure?</span>",
  //    buttons: {
  //      confirm: {
  //        label: 'Remove',
  //        className: 'btn-danger'
  //      },
  //      cancel: {
  //        label: 'Cancel',
  //        className: 'btn-default'
  //      }
  //    },
  //    callback: function (confirmRemove) {
  //      if (confirmRemove) { removeContribution(contributionId); }
  //    }
  //  });
}

function formattedDate(date) {
  return moment(date).calendar(
    null, 
    {
      sameDay: '[today]',
      lastDay: '[yesterday]',
      lastWeek: '['+ moment(date).fromNow() +']',
      sameElse: 'M/DD/YY'
    }
  ).split('at')[0];
}

export function actionsDropdownTemplate(status, invitationTemplate, story, viewStoryPath, editStoryPath) {
  return `
    <a href="javascript:;" class="dropdown-toggle" data-toggle="dropdown">
      <i class='fa fa-caret-down'></i>
    </a>

    <ul class='contributor-actions dropdown-menu dropdown-menu-right dropdown-actions'>

      ${ statusBasedActions(status, invitationTemplate) }

      <li role="separator" class="divider"></li>

      ${ storyBasedActions(story, viewStoryPath, editStoryPath) }
        
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

function statusBasedActions(status, invitationTemplate) {
  let actions = '';
  if (status === 'pre_request') {
    actions = actions.concat(`
      <li class="compose-invitation ${ invitationTemplate ? '' : 'disabled' }">
        <a href="javascript:;">
          <i class='fa fa-envelope fa-fw action'></i>&nbsp;&nbsp;
          <span>Compose Invitation</span>
        </a>
      </li>
    `);
  } else {
    actions = actions.concat(`
      <li class='view-request'>
        <a href="javascript:;">
          <i class='fa fa-search fa-fw action'></i>&nbsp;&nbsp;
          <span>View Sent Invitation</span>
        </a>
      </li>
    `);
  }
  if (status === 'did_not_respond') {
    actions = actions.concat(`
      <li class="re-send-invitation">
        <a href="javascript:;">
          <i class="fa fa-envelope fa-fw action"></i>&nbsp;&nbsp;
          <span>Re-send Invitation</span>
        </a>
      </li>
    `);
  }
  if ( status && status.match(/submitted/) ) {
    actions = actions.concat(`
      <li class="completed">
        <a href="javascript:;">
          <i class="fa fa-check fa-fw action"></i>&nbsp;&nbsp;
          <span>Mark as completed</span>
        </a>
      </li>
    `);
  }
  return actions;
}

function storyBasedActions(story, viewStoryPath, editStoryPath) {
  let actions = '';
  if (story && story.published) { 
    actions = actions.concat(`
      <li>
        <a href="${ viewStoryPath }"}>
          <i class="fa fa-search fa-fw action"></i>&nbsp;&nbsp;
          <span>View Story</span>
        </a>
      </li>
    `)
  } else if (story) {
    actions = actions.concat(`
      <li class="story-settings">
        <a href="${ editStoryPath }">
          <i class="fa fa-gear fa-fw action"></i>&nbsp;&nbsp;
          <span>Story Settings</span>
        </a>
      </li>
      <li class="story-content">
        <a href="${ editStoryPath }">
          <i class="fa fa-edit fa-fw action"></i>&nbsp;&nbsp;
          <span>Story Content</span>
        </a>
      </li>
      <li class="story-contributors">
        <a href="${ editStoryPath }">
          <i class="fa fa-users fa-fw action"></i>&nbsp;&nbsp;
          <span>Story Contributors</span>
        </a>
      </li>
    `)
  } else {
    actions = actions.concat(`
      <li class="view-success">
        <a href="javascript:;"}>
          <i class="fa fa-rocket fa-fw action"></i>&nbsp;&nbsp;
          <span>View Customer Win</span>
        </a>
      </li>
    `)
  }
  return actions;
}