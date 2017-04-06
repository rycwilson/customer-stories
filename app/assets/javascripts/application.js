
//= require jquery/dist/jquery
//= require jquery-ujs/src/rails
//= require turbolinks
//= require underscore/underscore
//= require bootstrap-sass/assets/javascripts/bootstrap-sprockets
//= require_tree ./lib
//= require plugins/plugins
//= require companies/companies
//= require stories/stories
//= require contributions/contributions
//= require profile/profile
//= require init

$(document).on('turbolinks:load', function (e) {
  setAppData();
  constructPlugins();
  app.init();
  // ref: https://clicky.com/help/apps-plugins#rails4turbo
  // clicky.log( document.location.pathname + document.location.search, document.title, 'pageview' )
});

$(document).one('turbolinks:load', function () {
  attachAppListeners();
  attachCompaniesListeners();
  attachStoriesListeners();
  attachProfileListeners();
  attachContributionsListeners();
});

function setAppData () {
  if (window.gon) {  // use window.gon in case undefined
    // console.log('gon: ', gon);
  } else {
    // console.log('gon undefined');
  }
  app.company = (window.gon && gon.company) || app.company || null;
  app.stories = (window.gon && gon.stories) || app.stories || null;
  app.current_user = (window.gon && gon.current_user) || app.current_user || null;
  app.env = (window.gon && gon.env) || app.env || null;
  app.charts = (window.gon && gon.charts) || app.charts || null;
  // console.log('app: ', app);
  getScreenSize();
}

function attachAppListeners () {

  xScrollBoundaries();
  yScrollBoundaries();

  $(document).on('click', '#workflow-tabs-list a', function (e) {
    if ($('body').hasClass('companies show')) {
      return false;  // TODO: why does this work but not e.preventDefault()?
    }
    var workflowTab = $(this).attr('href').substr(1, $(this).attr('href').indexOf('-')-1);
    Cookies.set('csp_workflow_tab', workflowTab);
    Turbolinks.visit('/companies/' + app.company.id.toString());
  });

  $(document)
    .on('turbolinks:click', function () {
      // console.log('turbolinks:click');
    })

    .on('turbolinks:before-visit', function () {
      // console.log('turbolinks:before-visit');
      // debugger;
    })

    .on('turbolinks:request-start', function () {
      // console.log('turbolinks:request-start');
      // debugger;
    })
    .on('turbolinks:visit', function () {
      // console.log('turbolinks:visit');
      // debugger;
    })

    .on('turbolinks:request-end', function () {
      // console.log('turbolinks:request-end');
      // debugger;
    })

    .on('turbolinks:before-cache', function () {
      // console.log('turbolinks:before-cache');
      deconstructPlugins();
    })

    .on('turbolinks:before-render', function (event) {
      // console.log('turbolinks:before-render');
    })

    .on('turbolinks:render', function () {
      // console.log('turbolinks:render');
      if (document.documentElement.hasAttribute('data-turbolinks-preview')) {
        // console.log('preview rendered');

        if ($('body').hasClass('not:companies not:show')) {
          $('#workflow-tabs-list').find('.active').removeClass('active');
        }
        constructPlugins();
      }
    });
}

function getScreenSize () {
  (function($, viewport){
    if (viewport.is('xs')) {
      app.screenSize = 'xs';
    } else if (viewport.is('sm')) {
      app.screenSize = 'sm';
    } else if (viewport.is('md')) {
      app.screenSize = 'md';
    } else if (viewport.is('lg')) {
      app.screenSize = 'lg';
    }
  })(jQuery, ResponsiveBootstrapToolkit);
}













