
function contributorInvitationListeners() {

  var modifyLinkDialog = function () {
        $('.link-dialog .note-link-url').prop('disabled', true);
        $('.link-dialog input[type="checkbox"]').prop('checked', true);
        $('.link-dialog input[type="checkbox"]').prop('disabled', true);
        $('.link-dialog .note-link-btn').removeClass('btn-primary').addClass('btn-success');  // for stying
      };

  $(document)

    /**
     * don't allow submit on hitting enter from subject input
     * ref https://stackoverflow.com/questions/895171
     */
    .on('keypress', '#contribution-request-form :input:not(textarea):not([type="submit"])', function (e) {
      return e.keyCode != 13;
    })

    // scroll can't be adjusted while the modal is hidden
    .on('hide.bs.modal', '#contribution-request-modal', function () {
      // there are a bunch of modals within the summernote editor, hence indexing
      $(this).find('.modal-body').eq(0).scrollTop(0);
    })

    // keep link dialog modifications limited to contribution request
    .on('shown.bs.modal', '#contribution-request-modal', function () {
      $(document).on('shown.bs.modal', '.link-dialog', modifyLinkDialog);
    })
    .on('hidden.bs.modal', '#contribution-request-modal', function () {
      $(document).off('shown.bs.modal', '.link-dialog', modifyLinkDialog);
    })
    // when link dialog closes, add .modal-open to body, else scroll will affect body instead of modal
    .on('hidden.bs.modal', function () {
      if ($('#contribution-request-modal').hasClass('in')) {
        $('body').addClass('modal-open');
      }
    });

}