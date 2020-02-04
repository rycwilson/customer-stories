
import headerTemplate from './con_header_template';
import { actionsDropdownTemplate } from './con_actions';
import 'vendor/datatables/editor.select2';

const columnIndices = {
  contributor: 1,
  success: 2,
  invitationTemplate: 3,
  curator: 4,
  customer: 5,
  status: 6,
  actions: 7,
  storyPublished: 8
}

export default {
  headerTemplate,
  get(contributionId) {
    return $('#contributors-table')
             .DataTable()
             .rows(`[data-contribution-id="${ contributionId }"]`)
             .data()[0]
            .contributor;
  },
  init(deferred) {
    $('#contributors-table').DataTable({
      ajax: {
        url: `/companies/${ APP.company.id }/contributions`,
        dataSrc: ''
      },
      autoWidth: false,
      dom: 'tip',
      // select: true,  // https://datatables.net/extensions/select/
      pageLength: 100,
      language: {
        emptyTable: 'No Contributors found',
        zeroRecords: 'No Contributors found'
      },
      order: [[columnIndices.customer, 'asc'], [columnIndices.success, 'asc'], [columnIndices.contributor, 'desc']],
      columns: [
        {
          name: 'childRow',
          data: 'success.id',
          render: (data, type, row) => `
            <i class="fa fa-caret-right"></i><i class="fa fa-caret-down"></i>
          `
        },
        {
          name: 'contributor',
          data: {
            _: (row, type, set, meta) => {
              // console.log(row)
              return {
                id: row.contributor.id,
                fullName: row.contributor.full_name,
                contributionId: row.id,
                curatorId: row.success.curator.id
              };
            },
            display: 'contributor.full_name',
            filter: 'contributor.full_name',
            sort: 'timestamp'  // contribution.created_at
          },
        },
        {
          name: 'success',
          defaultContent: 'Customer Win',
          data: {
            _: (row, type, set, meta) => (
              { id: row.success.id, name: row.success.name }
            ),
            filter: 'success.name',
            sort: 'success.name'
          }
        },
        // <td data-search="t<%#= contribution.invitation_template_id  %>" class='invitation-template'>
        {
          name: 'invitation_template',
          data: {
            _: 'invitation_template.id',
            display: 'invitation_template.name'
          },
          defaultContent: '<span class="placeholder">Select</span>'
        },

        {  // <td data-search="<%= contribution.success.curator.id %>"></td>
          name: 'curator',
          data: {
            _: (row, type, set, meta) => (
              { id: row.success.curator.id, fullName: row.success.curator.full_name }
            ),
            filter: 'success.curator.id',
          }
        },      // curator
          // <td data-search="c<%= contribution.customer.id %>"><%= contribution.customer.name %></td>
        {
          name: 'customer',
          data: {
            _: (row, type, set, meta) => (
              { id: row.success.customer.id, name: row.success.customer.name }
            ),
            filter: 'success.customer.name',
            sort: 'success.customer.name'
          },
          // orderData: [[columnIndices.customer, 'asc'], [columnIndices.success, 'asc'], [columnIndices.contributor, 'desc']]
        },
        {
          name: 'status',
          data: {
            _: 'status',
            display: 'display_status'
          }
        },
        {
          // data is status as this will determine actions available
          data: 'status',
          render: (status, type, row, meta) => {
            return actionsDropdownTemplate(
              status, 
              row.invitation_template, 
              row.success.story,
              row.success.story && row.success.story.csp_story_path,
              row.success.story && `/curate/${ row.success.customer.slug }/${ row.success.story.slug }`
            );
          }
        },
        {
          name: 'storyPublished',
          data: 'success.story.published',
          defaultContent: 'false'
        },
      ],

      columnDefs: [
        {
          targets: [columnIndices.success, columnIndices.curator, columnIndices.customer, columnIndices.storyPublished],
          visible: false
        },
        {
          targets: [0, columnIndices.actions],
          orderable: false,
        },
        {
          targets: [columnIndices.actions],
          searchable: false,
        },
        { width: '0%', targets: [columnIndices.success, columnIndices.curator, columnIndices.customer, columnIndices.storyPublished] },
        { width: '5%', targets: 0 },
        { width: '33%', targets: [columnIndices.contributor, columnIndices.invitationTemplate] },
        { width: '22%', targets: columnIndices.status },
        { width: '8%', targets: columnIndices.actions }
      ],

      // rowGroup: workflowStage === 'curate' ? null : {
      rowGroup: {
        dataSrc: 'success.name',
        startRender: (groupRows, successName) => {
          // console.log(successName + ': ', groupRows);
          // customer and story (if exists) data same for all rows, so just look at [0]th row
          const customerSlug = groupRows.data()[0].success.customer.slug;
          const customerName = groupRows.data()[0].success.customer.name;
          const story = groupRows.data()[0].success.story;
          const storySlug = story && story.slug;
          const storyTitle = story && story.title;
          const storyPath = story && (
            story.published ? 
              story.csp_story_path : 
              `/curate/${ customerSlug }/${ storySlug }`
          );
          return $('<tr/>').append(`
            <td colspan="5">
              <span>${ customerName }</span>
              <span class="emdash">&nbsp;&nbsp;&#8211;&nbsp;&nbsp;</span>
              <a href="${ story ? storyPath : 'javascript:;' }" 
                class="${ story ? 'story' : 'success' }">
                ${ story ? storyTitle : successName }
              </a>
            </td>
          `);
        }
      },
      createdRow: (row, data, index) => {
        $(row).attr('data-contribution-id', data.id);
        $(row).attr('data-success-id', data.success.id);
        $(row).attr('data-contributor-id', data.contributor.id);
        // note: these indices won't align with *index variables,
        // as these are only the unhidden columns
        // $(row).children().eq(0).attr('data-filter', data.success.id);
        $(row).children().eq(0).addClass('toggle-child-row');
        $(row).children().eq(1).addClass('contributor');
        $(row).children().eq(2)
          .addClass('invitation-template')
          .append('<i class="fa fa-pencil"></i>');
        $(row).children().eq(3).addClass('status');
        $(row).children().eq(4).addClass('actions dropdown');

        // template can only be selected if status is in
        // (a) request hasn't been sent yet
        // (b) did not respond (ready for re-send)
        const statusDisplay = $(row).children().eq(3).text();
        const disableTemplateSelect = (statusDisplay) => {
          return !['waiting', 'did not respond'].some((status) => {
            return statusDisplay.includes(status);
          })
        };
        if ( disableTemplateSelect(statusDisplay) ) {
          $(row).children().eq(2).addClass('disabled').find('i').remove();
        }
      },

      initComplete: function (settings, json) {
        const $table = $(this);
        const $tableWrapper = $table.closest('.dataTables_wrapper');

        // this is for the question mark icons that go with status= opt_out or remove
        $('[data-toggle="tooltip"]').tooltip();

        const initInvitationTemplateEditor = $.Deferred();
        $.when(initInvitationTemplateEditor).done(() => deferred.resolve());
        getInvitationTemplatesAndInitEditor($table, initInvitationTemplateEditor)
        $('.working--prospect').addClass('contributors-loaded');
        $tableWrapper.find('.dataTables_paginate').show();
      }
    })
  },
  remove(contributionId) {
    $('#contributors-table, #story-contributors-table').each((index, table) => {
      $(table).DataTable()
              .row(`[data-contribution-id="${ contributionId }"]`)
              .remove()
              .draw();
    });
  }
}

function getInvitationTemplatesAndInitEditor($table, deferred) {
  $.getJSON(
    `/companies/${ APP.company.id }/invitation_templates`,
    (templates, status, xhr) => {
      const templateSelectOptions = templates.map((template) => (
        { label: template.name, value: template.id }
      ))
      $table.find('td.invitation-template').on(
        'click',
        openInvitationTemplateEditor(
          $table, 
          newInvitationTemplateEditor(templateSelectOptions)
        )
      )       
      deferred.resolve();
    }
  )
}

function openInvitationTemplateEditor($table, invitationTemplateEditor) {
  return function(e) {
    const $td = $(this);
    const $tr = $td.parent();
    const dt = $table.DataTable();
    if ($(e.target).is('.btn-default')) return false;  // Cancel button

    // don't allow template change if request already sent (or re-sent)
    // (see createdRow property of datatables config)
    if ($td.hasClass('disabled')) return false;
    $td.addClass('editor-is-open');
    invitationTemplateEditor.inline(
      $td[0],
      'invitation_template.id',
      { 
        // default options: https://editor.datatables.net/reference/option/formOptions.inline
        onComplete: function (editor) {
          const contributionId = $tr.data('contribution-id');
          const rowData = dt.row($tr).data();
          editor.close();
  
          // the drawType option isn't forcing a re-draw (?), so re-draw the individual row(s)
          // forum discussion: https://datatables.net/forums/discussion/45189
          dt.row($tr).data(rowData).draw();
          $td.append(`
            <i class="fa fa-check" style="color:#456f59"></i>
            <i class="fa fa-pencil" style="display:none"></i>
          `);
          setTimeout(() => $td.find('i').toggle(), 2000);
  
          // re-draw the other table (if present)
          // if ($tableOther.length) {
          //   $rowOther = $tableOther.find('tr[data-contribution-id="' + contributionId + '"]');
          //   dtOther = $tableOther.DataTable();
          //   dtOther.row($rowOther).data(rowData).draw();
          // }
        },
        drawType: true,
  
        // buttons are in reverse order of how they're diplayed because they both have float:right
        buttons: [
          {
            label: `
              <span>Save</span>
              <i class="fa fa-spin fa-circle-o-notch" style="display: none"></i>
            `,
            className: 'btn btn-sm btn-success',
            fn: function () { this.submit(); }
          },
          {
            label: 'Cancel',
            className: 'btn btn-sm btn-default',
            fn: function () { this.close(); }
          }
        ]
      }
    );
  }
}

function newInvitationTemplateEditor(templateSelectOptions) {
  return new $.fn.dataTable.Editor({
    table: '#contributors-table',
    ajax: {
      edit: {
        type: 'put',
        url: '/contributions/_id_'
      },
    },
    idSrc: 'id',
    fields: [
      {
        label: 'Invitation Template',
        name: 'invitation_template.id',  // should match columns.data
        data: {
          _: 'invitation_template.id',
          display: 'invitation_template.name'
        },
        type: 'select2',
        options: templateSelectOptions
      },
    ],
    canReturnSubmit: () => true
  });
}



