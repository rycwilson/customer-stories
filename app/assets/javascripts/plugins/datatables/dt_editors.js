
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
        label: 'Select a template',
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
        // (this appears to be unnecessary for now => always a sync. load to get back and forth)
        if ($tableOther.length) {
          $rowOther = $tableOther.find('tr[contribution-id="' + contributionId + ']"');
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