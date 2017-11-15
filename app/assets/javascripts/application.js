
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

// attach listeners BEFORE running any page-specific js
// (e.g. if page-specific js manually triggers an event as in promote settings)
$(document).one('turbolinks:load', function () {
  attachAppListeners();
  attachCompaniesListeners();
  attachStoriesListeners();
  attachProfileListeners();
  attachContributionsListeners();
});

$(document).on('turbolinks:load', function (e) {
  setAppData();
  constructPlugins();
  app.init();
  // ref: https://clicky.com/help/apps-plugins#rails4turbo
  // clicky.log( document.location.pathname + document.location.search, document.title, 'pageview' )
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

  $(document)
    .on('click', '#workflow-tabs a', function (e) {
      e.preventDefault();
      var currentWorkflowPath = window.location.pathname,
          newWorkflowPath = '/' + $(this).attr('href').slice(1, $(this).attr('href').length);

      if ($('body').hasClass('companies show')) {
        // replacing state ensure turbolinks:false for the first tab state
        window.history.replaceState({ turbolinks: false }, null, currentWorkflowPath);
        window.history.pushState({ turbolinks: true }, null, newWorkflowPath);

      } else {
        Turbolinks.visit(newWorkflowPath);
      }
    })
    // apply styling when clicking on a company nav dropdown option,
    .on('click', 'a[href="/settings"], a[href="/user-profile"]',
      function () {
        var $thisDropdown = $(this).closest('li.dropdown'),
            $otherDropdown = $thisDropdown.parent().find('li.dropdown:not(.open)');
        $thisDropdown.addClass('active');
        $otherDropdown.removeClass('active');
      })

    .on('submit', 'form', function () {
      // presently limited to these forms
      if ($(this).attr('id') === 'story-settings-form') {
        $(this).find('button[type="submit"] span').toggle();
        $(this).find('button[type="submit"] .fa-spinner').toggle();
      }

    });

  //
  window.onpopstate = function (e) {
    // console.log('popstate')
    var workflowMatch = window.location.pathname.match(
            /(prospect|curate|promote|measure)(\/(\w|-)+)?/
          ),
        workflowStage = workflowMatch && workflowMatch[1],
        curateView = workflowStage && (workflowStage === 'curate') ?
                        (workflowMatch[2] ? 'story' : 'stories') : null;

    if (workflowStage) {
      $('#workflow-tabs a[href="#' + workflowStage + '"]').tab('show');
      if (curateView) {
        $('a[href="#curate-' + curateView + '"]').tab('show');
        // don't scroll to panel
        setTimeout(function() { window.scrollTo(0, 0); }, 1);
        if (curateView === 'stories') {
          $('.curate.curator-select').val(
            $('.curate.curator-select').children('[value="' + app.current_user.id.toString() + '"]').val()
          ).trigger('change', { auto: true });
        }
      }
    }

  };

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

    // this event appears to work best for doing stuff prior to leaving a page
    // note: this event occurs after the history state has been changed
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
        constructPlugins();
      }

    });
}

















