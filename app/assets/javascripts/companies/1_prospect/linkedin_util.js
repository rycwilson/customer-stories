
function loadCspOrPlaceholderWidget ($tr, contributor) {
  var widgetWidth = 400;

  // populate csp widget or placeholder widget;
  // the placeholder will be swapped out for the linkedin widget when it arrives
  if ($('.csp-widget-container').length) {
    $tr.find('.csp-widget-container').empty()
      .append(
        _.template($('#csp-linkedin-widget-template').html())({
          contributor: contributor,
          widgetWidth: widgetWidth
        })
      )
      .imagesLoaded(function () {
        $tr.find('.csp-linkedin-widget').removeClass('hidden');
      });
  } else {
    $tr.find('.placeholder-widget-container').empty()
      .append(
        _.template($('#csp-linkedin-widget-template').html())({
          loading: true,
          contributor: contributor,
          widgetWidth: widgetWidth
        })
      )
      .imagesLoaded(function () {
         $tr.find('.csp-linkedin-widget').removeClass('hidden');
      });
  }
}

function loadLinkedinWidget ($tr, contributor) {
  var widgetWidth = 400,
      cspWidgetIsPresent = $tr.find('.widget-container > .csp-widget-container').length;
  if (cspWidgetIsPresent) { return false; }
  else {
    var $placeholderWidgetContainer = $tr.find('.placeholder-widget-container'),
        $linkedinWidgetContainer = $tr.find('.linkedin-widget-container'),
        $widget = $("<script type='IN/MemberProfile' " +
                      "data-id='" + contributor.linkedin_url + "' " +
                      "data-format='inline' data-related='false' " +
                      "data-width='" + widgetWidth.toString() + "'></script>"),
        widgetMarginTop = '-' + $placeholderWidgetContainer.css('height'),
        newWidgetPostMesgHandler = function (event) {
          // TOFIX: manage body class when async loading stories#edit
          if ( $('body').hasClass('companies show') || $('body').hasClass('stories edit') ) {
            // in Chrome, the origin property is in the event.originalEvent object
            var origin = event.origin || event.originalEvent.origin;
            if (origin === "https://platform.linkedin.com" && event.data.includes('widgetReady')) {
              var newWidgetId = $linkedinWidgetContainer.find('iframe').attr('id'),
                  widgetReadyId = event.data.match(/^(\w+)\s/)[1];
              if (newWidgetId &&
                  widgetReadyId === newWidgetId.match(/^\w+(li_gen\w+)_provider/)[1]) {
                $linkedinWidgetContainer
                  .css('margin-top', widgetMarginTop)  // height of the placeholder container (for overlay)
                  .removeClass('hidden')
                  .closest('.widget-container')
                  .data('linkedin-widget-loaded', true);
                window.removeEventListener('message', newWidgetPostMesgHandler, false);
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