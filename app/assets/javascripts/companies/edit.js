
//= require ./settings/profile
//= require ./settings/crowdsourcing_templates/crowdsourcing_templates
//= require ./settings/tags_and_ctas
//= require ./settings/widget_config

function companiesEdit () {

  $('.dropdown.company-settings').addClass('active');

  $(document)
    .one('turbolinks:before-visit', function () {
      if ($('.dropdown.company-settings').hasClass('active')) {
        $('.dropdown.company-settings').removeClass('active');
      }
    })
    .one('click', '.workflow-tabs', function () {
      if ($('.dropdown.company-settings').hasClass('active')) {
        $('.dropdown.company-settings').removeClass('active');
      }
    });



}

function companiesEditListeners () {
  companyProfileListeners();
  crowdsourcingTemplatesListeners();
  storyTagsListeners();
  storyCTAsListeners();
  widgetConfigListeners();
}













