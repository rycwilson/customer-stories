
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

    .on('input', '#crowdsourcing-template-form input, ' +
                 '#crowdsourcing-template-form .note-editable', function () {
      $('#crowdsourcing-template-form').attr('data-dirty', '1');
    })

    .on('submit', '#crowdsourcing-template-form', function () {
      $(this).find('button[type="submit"] span').toggle();
      $(this).find('button[type="submit"] .fa-spinner').toggle();
    });

}

