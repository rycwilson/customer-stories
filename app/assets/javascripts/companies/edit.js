
//= require ./settings/profile
//= require ./settings/crowdsourcing_templates/crowdsourcing_templates
//= require ./settings/tags_and_ctas
//= require ./settings/widget_config

function companiesEdit () {

  $('.dropdown.company-settings').addClass('active');

  var url = document.location.toString();
  if (url.match('#')) {
    $('.nav-layout-sidebar a[href="#' + url.split('#')[1] + '"]').tab('show');
    window.scrollTo(0, 0);
  }
  $('.nav-layout-sidebar a').on('shown.bs.tab', function (e) {
    window.location.hash = e.target.hash;
  });

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
  storyCTAsListeners();
  widgetConfigListeners();

}













