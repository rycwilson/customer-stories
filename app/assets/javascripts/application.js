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
  }, 3000);

  // clcear localStorage
  $('#logout').on('click', function () {
    localStorage.clear();
  });

});










