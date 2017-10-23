
function contributorDetailsListeners () {

  $(document)
    .on('click', 'td.contributor-details', function () {

      var $table = $(this).closest('table'),
          dt = $(this).closest('table').DataTable(),
          $tr = $(this).closest('tr'),
          dtRow = dt.row($tr),
          template = _.template($('#contributor-template').html()),
          workflowStage = $table.attr('id').slice(0, $table.attr('id').indexOf('-')),
          contributionId = $tr.data('contribution-id'),
          contributionPath = '/contributions/' + contributionId,
          contribution = app.contributions.find(function (c) {
            return c.id === contributionId;
          });

      if (dtRow.child.isShown()) {
        dtRow.child.hide();
        $tr.children().last().css('color', '#666');
        $tr.find('td.contributor-name > span').removeClass('shown');
        $tr.removeClass('shown active');
      }
      else {
        dtRow.child(
          template({
            contribution: contribution,
            contributionPath: contributionPath,
            workflowStage: workflowStage
          })
        ).show();
        $tr.children().last().css('color', 'white');
        $("input[type='tel']").inputmask("999-999-9999");
        $tr.find('td.contributor-name > span').addClass('shown');
        if (contribution.contributor.linkedin_url) {
          loadCspOrPlaceholderWidget($tr.next(), contribution);
          loadLinkedinWidget($tr.next(), contribution);
        }
        $tr.addClass('shown active');
      }
      $(this).children().toggle();  // toggle caret icons

    })

    .on('submit', '.contributor-form', function () {
      $(this).find('button[type="submit"] span').toggle();
      $(this).find('button[type="submit"] .fa-spinner').toggle();
    });
}

function loadCspOrPlaceholderWidget ($tr, contribution) {
  var widgetWidth = 400,
      template = _.template($('#csp-linkedin-widget-template').html());

  // populate csp widgets and placeholder widgets;
  // the placeholders will be swapped out for linkedin widgets as they arrive
  $tr.find('.csp-widget-container')
    .append( template({ contributor: contribution.contributor,
                        widgetWidth: widgetWidth }) )
    .imagesLoaded(function () {
       $tr.find('.csp-linkedin-widget').removeClass('hidden');
     });

  $tr.find('.placeholder-widget-container')
    .append( template({ loading: true,
                        contributor: contribution.contributor,
                        widgetWidth: widgetWidth }) )
    .imagesLoaded(function () {
      // .csp-linkedin-widget may be a csp widget populated with data,
      // or (in this case) the placeholder widget
       $tr.find('.csp-linkedin-widget').removeClass('hidden');
     });
}

function loadLinkedinWidget ($tr, contribution) {
  var widgetWidth = 400,
      cspWidgetIsPresent = $tr.find('.widget-container > .csp-widget-container').length;
  if (cspWidgetIsPresent) { return false; }
  else {
    var $placeholderWidgetContainer = $tr.find('.placeholder-widget-container'),
        $linkedinWidgetContainer = $tr.find('.linkedin-widget-container'),
        $widget = $("<script type='IN/MemberProfile' " +
                      "data-id='" + contribution.contributor.linkedin_url + "' " +
                      "data-format='inline' data-related='false' " +
                      "data-width='" + widgetWidth.toString() + "'></script>"),
        widgetMarginTop = '-' + $placeholderWidgetContainer.css('height'),
        newWidgetPostMesgHandler = function (event) {
          // console.log(event);
          if ( $('body').hasClass('companies show') ) {
            // in Chrome, the origin property is in the event.originalEvent object
            var origin = event.origin || event.originalEvent.origin;
            if ( origin === "https://platform.linkedin.com" &&
                 event.data.includes('widgetReady') ) {
              var newWidgetId = $linkedinWidgetContainer.find('iframe').attr('id'),
                  widgetReadyId = event.data.match(/^(\w+)\s/)[1];
                  // console.log('newWidgetId: ', newWidgetId);
              if (newWidgetId &&
                  widgetReadyId === newWidgetId.match(/^\w+(li_gen\w+)_provider/)[1]) {
                $linkedinWidgetContainer
                  .css('margin-top', widgetMarginTop)  // height of the placeholder container (for overlay)
                  .removeClass('hidden');
                  // .closest('.widget-container')
                  // .data('linkedin-widget-loaded', true);
              }
            }  // widgetReady event
          }
        };  // var declarations

    $linkedinWidgetContainer.append($widget);
    window.addEventListener('message', newWidgetPostMesgHandler, false);
    IN.parse();
    setTimeout(function () {
      if ($tr.find('.widget-container').data('linkedin-widget-loaded')) {
        // success (just leave the placeholder; removing or emptying will affect layout)
      } else {
        // failure
        $placeholderWidgetContainer
          .find('.member-info > p')
          .css('color', '#D9534F')
          .text('Profile data not available');
      }
    }, 7000);
    // remove the listener when navigating away from this page
    $(document).one('turbolinks:before-visit', function () {
      window.removeEventListener('message', newWidgetPostMesgHandler, false);
    });
  }
}