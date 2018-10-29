
//= require ./settings/profile
//= require ./settings/invitation_templates/invitation_templates
//= require ./settings/tags_and_ctas
//= require ../widgets/config

function companiesEdit () {

  $('.dropdown.company-settings').addClass('active');

  var url = document.location.toString();
  if (url.match('#')) {
    $('.nav-layout-sidebar a[href="#edit-' + url.split('#')[1] + '"]').tab('show');
  } else {
    $('.nav-layout-sidebar a[href="#edit-company-profile"]').tab('show');
  }
  $('.layout-main').show();

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
    })
    .on('shown.bs.tab', '.nav-layout-sidebar a', function (e) {
      window.location.hash = e.target.hash.replace('edit-', '');
      window.scrollTo(0, 0);
    });
}

function companiesEditListeners () {

  companyProfileListeners();
  invitationTemplatesListeners();
  storyCTAsListeners();
  widgetConfigListeners();

}













