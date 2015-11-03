app/assets/javascripts/analytics.js

// http://stackoverflow.com/questions/18632644/google-analytics-with-rails-4
// https://clicky.com/help/apps-plugins#rails4turbo

// Javascript
$(document).on 'page:change', ->
  if window.clicky?
    clicky.log( document.location.pathname + document.location.search, document.title, 'pageview' );

    

