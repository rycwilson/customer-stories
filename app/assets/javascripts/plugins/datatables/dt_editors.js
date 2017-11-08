
function newPromotedStoriesEditor() {
  return new $.fn.dataTable.Editor({
    table: '#promoted-stories-table',
    ajax: {
      url: '/stories/_id_/promote',
      type: 'put',
      data: function (data) {
        var storyId = Object.keys(data.data)[0];
        return {
          adwords: {
            long_headline: data.data[storyId].long_headline
          }
        };
      }
    },
    idSrc: 'id',
    fields: [
      {
        label: 'Sponsored Story Title',
        name: 'long_headline',
        data: 'ads_long_headline',
        type: 'textarea'
      }
    ]
  });
}

function openPromotedStoriesEditor (promotedStoriesEditor, $row) {
  promotedStoriesEditor.inline(
    $row.find('td.promoted-story-title')[0],
    'long_headline',
    { // default options: https://editor.datatables.net/reference/option/formOptions.inline
      onComplete: function (editor) {
        var storyId = $row.data('story-id'),
            $table = $(editor.s.table),
            dt = $table.DataTable(),
            rowData = dt.row($row).data();
        editor.close();

        // the drawType option isn't forcing a re-draw (?), so re-draw the individual row(s)
        // forum discussion: https://datatables.net/forums/discussion/45189
        dt.row($row).data(rowData).draw();

        // update adwords
        $.ajax({
          url: '/stories/' + storyId + '/adwords',
          method: 'put',
          data: { long_headline_changed: true },
          dataType: 'script'
        });
      },
      drawType: true,
      // buttons are in reverse order of how they're diplayed because they both have float:right
      buttons: [
        {
          label: 'Save',
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
        name: 'crowdsourcing_template.id',  // should match columns.data
        data: {
          _: 'crowdsourcing_template.id',
          display: 'crowdsourcing_template.name'
        },
        type: 'select2',
        options: templateSelectOptions
      },
    ]
  });

}

function openContributorsEditor (contributorsEditor, $row) {
  contributorsEditor.inline(
    $row.find('td.crowdsourcing-template')[0],
    'crowdsourcing_template.id',
    { // default options: https://editor.datatables.net/reference/option/formOptions.inline
      onComplete: function (editor) {
        var contributionId = $row.data('contribution-id'),
            $table = $(editor.s.table),
            $tableOther = $('table[id*="contributors-table"]').not($table),
            dt = $table.DataTable(),
            rowData = dt.row($row).data(),
            $rowOther, dtOther;

        editor.close();
        // the drawType option isn't forcing a re-draw (?), so re-draw the individual row(s)
        // forum discussion: https://datatables.net/forums/discussion/45189
        dt.row($row).data(rowData).draw();
        $row.find('td.crowdsourcing-template').append(
          '<i class="fa fa-check" style="color:#456f59"></i>' +
          '<i class="fa fa-caret-down" style="display:none"></i>'
        );
        setTimeout(function () {
          $row.find('td.crowdsourcing-template i').toggle();
        }, 2000);
        // re-draw the other table (if present)
        if ($tableOther.length) {
          $rowOther = $tableOther.find('tr[data-contribution-id="' + contributionId + '"]');
          dtOther = $tableOther.DataTable();
          dtOther.row($rowOther).data(rowData).draw();
        }
      },
      drawType: true,
      buttons: {
        label: 'Save',
        className: 'btn-success btn-sm',
        fn: function () { this.submit(); }
      }
    }
  );

}