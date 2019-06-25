
function newPromotedStoriesEditor() {
  return new $.fn.dataTable.Editor({
    table: '#promoted-stories-table',
    ajax: {
      url: '/stories/_id_/update_gads',
      type: 'put',
      data: function (data) {
        var storyId = Object.keys(data.data)[0];
        return {
          story: {
            topic_ad_attributes: {
              id: $('#promoted-stories-table').DataTable()
                    .row('[data-story-id="' + storyId + '"]').data()
                    .topic_ad.id,
              description: data.data[storyId].description
            },
            retarget_ad_attributes: {
              id: $('#promoted-stories-table').DataTable()
                    .row('[data-story-id="' + storyId + '"]').data()
                    .retarget_ad.id,
              description: data.data[storyId].description
            }
          }
        };
      },
      success: function () {
        console.log('editor success')
      }
    },
    idSrc: 'id',
    fields: [
      {
        label: 'Promoted Story Title',
        name: 'description',
        data: 'ads_description',
        type: 'textarea'
      }
    ]
  });
}

function openPromotedStoriesEditor (promotedStoriesEditor, $row) {
  promotedStoriesEditor.inline(
    $row.find('td.promoted-story-title')[0],
    'description',
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

function newContributorsEditor (workflowStage, templateSelectOptions) {
  return new $.fn.dataTable.Editor({
    table: '#' + workflowStage + '-contributors-table',
    ajax: {
      edit: {
        type: 'PUT',
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
    ]
  });
}

function openContributorsEditor (contributorsEditor, $row) {
  contributorsEditor.inline(
    $row.find('td.invitation-template')[0],
    'invitation_template.id',
    { // default options: https://editor.datatables.net/reference/option/formOptions.inline
      onComplete: function (editor) {
        var contributionId = $row.data('contribution-id'),
            $table = $(editor.s.table),
            $tableOther = $('#prospect-contributors-table, #curate-contributors-table').not($table),
            dt = $table.DataTable(),
            rowData = dt.row($row).data(),
            $rowOther, dtOther;

        editor.close();
        // the drawType option isn't forcing a re-draw (?), so re-draw the individual row(s)
        // forum discussion: https://datatables.net/forums/discussion/45189
        dt.row($row).data(rowData).draw();
        $row.find('td.invitation-template').append(
          '<i class="fa fa-check" style="color:#456f59"></i>' +
          '<i class="fa fa-caret-down" style="display:none"></i>'
        );
        setTimeout(function () {
          $row.find('td.invitation-template i').toggle();
        }, 2000);
        // re-draw the other table (if present)
        if ($tableOther.length) {
          $rowOther = $tableOther.find('tr[data-contribution-id="' + contributionId + '"]');
          dtOther = $tableOther.DataTable();
          dtOther.row($rowOther).data(rowData).draw();
        }
      },
      drawType: true,
      // buttons are in reverse order of how they're diplayed because they both have float:right
      buttons: [
        {
          label: '<span>Save</span><i class="fa fa-spin fa-circle-o-notch" style="display:none"></i>',
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