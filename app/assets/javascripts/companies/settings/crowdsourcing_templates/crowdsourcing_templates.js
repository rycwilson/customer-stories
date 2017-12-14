
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
    });

}

