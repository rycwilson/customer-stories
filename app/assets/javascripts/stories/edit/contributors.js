
function storiesEditContributors () {
  // loadCspOrPlaceholderWidgets();
}

function storiesEditContributorsListeners () {

  /**
   * since the 'invalid' event doesn't bubble up, validation listeners can't be delegated
   * and must be attached directly to the inputs (or form if calling formEl.checkValidity())
   */
  var formValidationListeners = function () {
    $('#new-contributor-form').find('select, input').on('invalid', function () {
      $(this).closest('.form-group').addClass('has-error');

      /**
       * the only form input(s) that can have a validation error other than 'required'
       * is the contributor (or referrer) email, which can be missing, improperly formatted or a duplicate;
       * first two handled by client, duplicate handled by server
       */
      if ($(this).is('[id*="contributor_attributes_email"]') ||
          $(this).is('[id*="referrer_attributes_email"]')) {
        if ($(this)[0].validity.typeMismatch) {
          $(this).next().text('Invalid email format');
        } else {
          $(this).next().text('Required');
        }
      }
    });
  };

  formValidationListeners();

}