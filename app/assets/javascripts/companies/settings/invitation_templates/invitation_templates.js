
//= require ./select_template
//= require ./template_actions
//= require ./contributor_questions
//= require ./data_placeholders

function invitationTemplatesListeners () {

  selectTemplateListeners();
  templateActionsListeners();
  contributorQuestionsListeners();
  dataPlaceholdersListeners();

  $(document)
    .on('input', '#invitation-template-form input, #invitation-template-form .note-editable', function () {
      $('#invitation-template-form').attr('data-dirty', '1');
    })
    .on('click', 'button[form="invitation-template-form"]', function (e) {
      var $form = $('#' + $(this).attr('form')), $button = $(this);
      e.preventDefault();
      if ($form.data('submitted')) {
        return false;
      } else {
        if ($form.find('textarea.note-codable').css('display') === 'block') {
          $form.find('button[data-original-title="Code View"]').click();
        }
        toggleFormWorking($form);
        $form.submit();
      }
    });

}

