
//= require ./select_template
//= require ./template_actions
//= require ./contributor_questions
//= require ./data_placeholders

function crowdsourcingTemplatesListeners () {

  selectTemplateListeners();
  templateActionsListeners();
  contributorQuestionsListeners();
  dataPlaceholdersListeners();

  $(document)
    .on('input', '#crowdsourcing-template-form input, #crowdsourcing-template-form .note-editable', function () {
      $('#crowdsourcing-template-form').attr('data-dirty', '1');
    })
    .on('click', 'button[form="crowdsourcing-template-form"]', function (e) {
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

