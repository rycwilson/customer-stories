function successActionsListeners () {
  $(document)
    .on('click', '.success-actions .remove', confirmDelete);

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
}