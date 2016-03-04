// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery/dist/jquery
//= require jquery-ujs/src/rails
//= require rails-turbolinks/lib/assets/javascripts/turbolinks
//= require underscore/underscore
//= require bootstrap-sass/assets/javascripts/bootstrap
//= require mvpready-core
//= require mvpready-helpers
//= require flot/jquery.flot

// require_tree ./sitewide (under construction)

// flash messaging
$(function() {

  setTimeout(function () {
    $('#flash').slideUp();
  }, 4000);

  // clear localStorage
  $('#logout').on('click', function () {
    localStorage.clear();
    sessionStorage.clear();
  });

});

// status should be one of: success, info, warning, danger
function flashDisplay (mesg, status) {
  $('#flash').toggleClass('hidden alert-' + status).append(mesg);
  $('#flash').hide().append(flash).fadeIn('fast');

  setTimeout(function () {
    $('#flash').slideUp();
  }, 4000);

  setTimeout(function () {
    $('#flash').toggleClass('hidden alert-' + status);
    // dispay:none setting appears after first click-cycle,
    // leads to subsequent failures
    // solution...
    $('#flash').css('display', '');
    // remove all text, leave child elements
    $('#flash').html($('#flash').children());
  }, 5000);
}













