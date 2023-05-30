const storyTitleRequirements = 'Max 90 characters';
const editorConfig = {
  table: '#promoted-stories-table',
  ajax: {
    url: '/stories/_id_/update_gads',
    type: 'put',
    data: (data) => {
      const storyId = Object.keys(data.data)[0];
      const longHeadline = data.data[storyId].long_headline;
      const rowData = () => $('#promoted-stories-table').DataTable().row(`[data-story-id="${storyId}"]`).data();
      return {
        story: {
          topic_ad_attributes: {
            id: rowData().topic_ad.id,
            long_headline: longHeadline
          },
          retarget_ad_attributes: {
            id: rowData().retarget_ad.id,
            long_headline: longHeadline
          }
        }
      };
    },
    success: (data, status, xhr) => {
      // console.log(data)
    }
  },
  idSrc: 'id',
  fields: [
    {
      label: '', // 'Promoted Story Title',
      name: 'long_headline',
      data: 'ads_long_headline',
      type: 'textarea'
    }
  ]
}

export default {
  initTable(promotedStories) {
    console.log('init promoted stories', promotedStories)
    const indices = { customer: 0, title: 1, status: 2, actions: 3 }
    const table = new DataTable('#promoted-stories-table', {
      // ajax: {
      //   url: `/companies/${CSP.company.id}/stories/promoted`,
      //   dataSrc: ''
      // },
      data: promotedStories,
      autoWidth: false,
      dom: 'tp',
      language: {
        emptyTable: 'No Promoted Stories found',
        zeroRecords: 'No Promoted Stories found'
      },
      order: [[ indices.status, 'asc' ]],
      columns: [
        {
          name: 'customer',
          data: 'success.customer.name'
        },
        {
          name: 'long_headline',
          data: 'ads_long_headline'
        },
        {
          name: 'status',
          data: 'ads_status',
          render: (ads_status, type, row, meta) => {
            return type !== 'display' ?
              ads_status : `
              <form action="/stories/${row.id}/update_gads" class="ads-status" method="put" data-remote="true" data-type="script" data-submitted="">
                <!-- topic -->
                <input type="hidden" name="story[topic_ad_attributes][id]" value="${row.topic_ad.id}">
                <input type="hidden" name="story[topic_ad_attributes][status]" value="PAUSED">
                <input 
                  type="checkbox"
                   class="bs-switch promote-control form-control"
                   name="story[topic_ad_attributes][status]"
                   value="ENABLED"
                   data-on-text="<i class='fa fa-fw fa-play'></i><i class='fa fa-fw fa-spin fa-circle-o-notch' style='display:none'></i><i class='fa fa-fw fa-check' style='display:none'></i>"
                   data-off-text="<span><i class='fa fa-fw fa-pause'></i><i class='fa fa-spin fa-circle-o-notch' style='display:none;'></i><i class='fa fa-fw fa-check' style='display:none'></i>"
                   ${ads_status === 'ENABLED' ? 'checked' : null}>
                <div style="height: 14px;">
                  <span class="help-block" style="font-size: 10px; margin: 0">${ads_status}</span>
                </div>
                <!-- retarget -->
                <input type="hidden" name="story[retarget_ad_attributes][id]" value="${row.retarget_ad.id}">
                <input type="hidden" name="story[retarget_ad_attributes][status]" value="PAUSED">
                <input 
                  type="checkbox" 
                  class="hidden" 
                  name="story[retarget_ad_attributes][status]" 
                  value="ENABLED"
                  ${ads_status === 'ENABLED' ? 'checked' : null}>
              </form>`
          }
        },
        {
          data: 'id',
          render: (storyId, type, row, meta) => `
            <a href="javascript:;" class="dropdown-toggle" data-toggle="dropdown">
              <i class="fa fa-caret-down" style="text-decoration:none;"></i>
            </a>
            <ul class="dropdown-menu dropdown-menu-right dropdown-actions">
            <li>
              <a data-toggle="modal" data-target="#ads-images-modal" role="button">
                <i class="fa fa-fw fa-image action"></i>&nbsp;&nbsp;
                <span>Assign Images</span>
              </a>
            </li>
            <li>
              <a href="/promote/preview/${storyId}" target="_blank">
                <i class="fa fa-fw fa-external-link action"></i>&nbsp;&nbsp;
                <span>Preview</span>
              </a>
            </li>
          `
        }
      ],
      columnDefs: [
        {
          targets: [indices.title, indices.actions],
          orderable: false
        },
        {
          // targets: [indices.status, indices.title, indices.actions],
          targets: [indices.status, indices.title],
          searchable: false
        },
        //{ width: '22%', targets: imageIndex },
        { width: '22%', targets: indices.customer },
        { width: '46%', targets: indices.title },
        { width: '10%', targets: indices.status },
        { width: '8%', targets: indices.actions },
      ],
      createdRow: function (row, promotedStory, index) { 
        const $table = $(this); 
        const $row = $(row);
        $row.attr('data-story-id', promotedStory.id);
        $row.children().eq(0).addClass('promoted-story-customer').attr('data-title', promotedStory.title);
        $row.children().eq(1).addClass('promoted-story-title form-is-clean');
        $row.children().eq(2).addClass('status dropdown');
        $row.children().eq(3).addClass('actions dropdown');
        // $row.children().eq(4).addClass('actions dropdown');

        // add a flash message container
        $row.prepend(`
          <td colspan="4" class="flash">
            <div style="position:relative">
              <button style="position: absolute; top: 0; right: 7px; font-size: 30px; cursor: pointer" type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <span>Sorry, there was an error when updating the Promoted Story. Please contact</span>&nbsp;<a href="mailto:support@customerstories.net?subject=Error when updating a Promoted Story">support@customerstories.net</a>
            </div>
          </td>
        `)
      },
      initComplete: function (settings, json) {
        const $table = $(this);
        const $tableWrapper = $table.parent();
        const renderPreviewSelect = function (isUpdate) {
          if (isUpdate) {
            $('#ads-preview-select')
              .find('option:not(:first-of-type)')
                .remove()
                .end()
              .select2('destroy');
          } else {
            $table.closest('[id*="table_wrapper"]').prepend(`
              <div class="form-inline pull-right" style="margin: 8px 0 20px 0">
                <div class="form-group">
                  <label style="margin-right: 10px">Preview</label>
                  <select id="ads-preview-select" class="form-control" style="width: 320px">
                    <option></option>
                  </select>
                </div>
              </div>
            `);
          }
          $('#ads-preview-select').select2({
            theme: 'bootstrap',
            placeholder: 'Select a Promoted Story',
            width: 'style',
            data: $table.DataTable().rows().data().toArray().map(promotedStory => (
              { id: promotedStory.slug, text: promotedStory.ads_long_headline }
            ))
          });
        };
        const initEditorFlash = () => (
          $table.find('td.flash').each((i, td) => $(td).css('height', $(td).parent().css('height')))
        );
        const editorFlash = ($row, res, promotedStory) => {
          if (res.errors) {
            $row
              .find('td.flash > div')
                .addClass('alert alert-danger')
                .end()
              .children()
                .toggle();
          } else {
            $row.find('td.promoted-story-title')
              .addClass('alert alert-success')
              .html('<i class="fa fa-fw fa-check"></i>&nbsp;&nbsp;<span>Updated</span>');
            setTimeout(() => {
              $row.find('td.promoted-story-title')
                .empty()
                .removeClass('alert alert-success')
                .text(promotedStory.ads_long_headline);
            }, 2500);
          }
        };
        //renderPreviewSelect();
        addClickBlockers($table);
        initStatusSwitch($table);
        // initEditorFlash();
        // const editor = new $.fn.dataTable.Editor(editorConfig)
        // editor.on('open', onEditorOpen);
        // editor.on('close', onEditorClose);
        // editor.on('preSubmit', onEditorPreSubmit);
        // editor.on('postEdit', (e, data, rowData) => {
        //   // console.log('postEdit')
        // });
        // editor.on('submitComplete', onEditorSubmitComplete);
        $table.on('draw.dt', (e) => {
          addClickBlockers($table);
          initStatusSwitch($table);
        })
        $table.on('pre-row-reorder.dt', (e, node, index) => {
          // console.log('pre-row-reorder')
        })
        $table.css('visibility', 'visible');
        $('.working--promote').addClass('promoted-stories-loaded');
        $tableWrapper.find('.dataTables_paginate').show();
      }
    });
  }
}

function openEditor($row) {
  editor.inline(
    $row.find('td.promoted-story-title')[0],
    'long_headline',
    { // default options: https://editor.datatables.net/reference/option/formOptions.inline
      submit: 'all',
      onComplete: function (editor) {
        // console.log('onComplete')
      },
      drawType: 'none', 
      // buttons are in reverse order of how they're diplayed because they both have float:right
      buttons: [
        {
          label: '<span>Save</span><i class="fa fa-spin fa-circle-o-notch" style="display:none"></i>',
          className: 'btn btn-sm btn-success disabled',
          type: 'submit',
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

function onEditorOpen(e) {
  $('.DTE')
    .closest('td').addClass('editor-is-open').end()
    .closest('tr').addClass('active');
  $('#DTE_Field_long_headline').attr('maxlength', '<%= RESPONSIVE_AD_LONG_HEADLINE_MAX.to_s %>');
  $('.DTE_Form_Buttons').prepend(`<span class="help-block">${storyTitleRequirements}</span>`);
}

function onEditorClose(e) {
  $('#promoted-stories-table')
    .find('td.editor-is-open')
      .removeClass('editor-is-open')
      .closest('tr').removeClass('active');
}

function onEditorPreSubmit(e, data, action) {
  if ($('.DTE_Inline').closest('td').hasClass('form-is-clean')) return false;
  $('.DTE_Inline')
    .closest('tr')
      .attr('data-submitted', true)
      .end()
    .find('.DTE_Form_Buttons button:nth-of-type(1)')
      .find('span, .fa-spin')
        .toggle();
}

function onEditorSubmitComplete(e, res, promotedStory, action) {
  // this.close();  => apparently happens automatically
  const $table = $(this.s.table);
  const dt = $table.DataTable();
  const $row = $table.find(`tr[data-story-id="${promotedStory.id}"]`);
  $row.removeClass('active');
  updateRow($table, dt, $row, promotedStory);
  //editorFlash($row, res, promotedStory);
  //renderPreviewSelect(true);
}

function updateRow($table, dt, $row, promotedStory) {
  //dt.row($row).invalidate().draw('data');  
  //dt.row($row).data(promotedStory);
  addClickBlockers($table, $row);
  initStatusSwitch($table, $row);  // this will take care of tooltip
  $row
    .find('td.promoted-story-title')
      .addClass('form-is-clean')
      .removeClass('editor-is-open')  // this doesn't work when it's done by the close event after submission
      .end()
    .attr('data-submitted', '');
}

function addClickBlockers($table, $row) {
  const $rows = $row ? $row : $table.find('tr[data-story-id]');
  $rows.each((i, row) => {
    $(row).find('td.promoted-story-title, td.status').prepend('<div class="click-blocker"></div>');
  });
};

function addStatusTooltip($row) {
  $row.find('td.status .click-blocker')
    .tooltip({ 
      container: 'body', 
      placement: 'left',
      template: `
        <div class="tooltip" role="tooltip">
          <div class="tooltip-arrow"></div>
          <div class="tooltip-inner promoted-story-status"></div>
        </div>
      `,
      title: 'Contact Customer Stories to enable this feature',
      delay: { show: 500, hide: 0 } 
    });
}

function initStatusSwitch($table, $row) {
  const $rows = $row ? $row : $table.find('tr[data-story-id]');
  const promoteIsDisabled = !$table.data('promote-tr');
  $rows.each(function () {
    $(this).find('.bs-switch.promote-control').bootstrapSwitch({
      size: 'small',
      disabled: promoteIsDisabled,
      onInit: function (e) {}
    });
    if (promoteIsDisabled) addStatusTooltip($(this));
  });
}