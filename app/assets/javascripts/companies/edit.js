
//= require ./settings/profile
//= require ./settings/invitation_templates/invitation_templates
//= require ./settings/tags_and_ctas
//= require ../plugins/config

function companiesEdit () {
  var fragment = location.href.match(/#(company-profile|crowdsource|plugins|ctas|tags)$/) &&
                 location.href.match(/#(company-profile|crowdsource|plugins|ctas|tags)$/)[1];

  $('a[href="#edit-' + fragment || 'company-profile' + '"]').tab('show');
  $('.dropdown.company-settings').addClass('active');

  $('.layout-main').show();

  $(document)

    .one('turbolinks:before-visit', function () {
      if ($('.dropdown.company-settings').hasClass('active')) {
        $('.dropdown.company-settings').removeClass('active');
      }
    })

    .one('click', '.nav-workflow', function () {
      if ($('.dropdown.company-settings').hasClass('active')) {
        $('.dropdown.company-settings').removeClass('active');
      }
    })
    
    .on('shown.bs.tab', '.nav--company a', function (e) {
      Cookies.set('company-tab', e.target.hash);
      location.hash = e.target.hash.replace('edit-', '');
      window.scrollTo(0, 0);
    })

}

function companiesEditListeners () {

  companyProfileListeners();
  invitationTemplatesListeners();
  pluginConfigListeners();

}













