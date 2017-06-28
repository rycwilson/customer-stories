
function crowdsourceListeners () {

  $(document)
    .one('click', '#crowdsource-panel', loadCspOrPlaceholderWidgets)

    // adding linkedin widget to contributor details
    // TODO: put this in js response to PUT contributions/:id
    .on("ajax:success", ".best_in_place[data-bip-attribute='linkedin_url']",
      function (event) {
        var urlInput = $(this), url = $(this).text(), widgetWidth = 322,
          validUrl = function ($url) {
            // detect valid url by comparing to the input placeholder
            return $url.html() !== urlInput.attr('data-bip-placeholder');
          },
          template = _.template($('#csp-linkedin-widget-template').html()),
          $card = $(this).closest('.contribution-card'),
          $checkboxAndWidget = $card.find('.linkedin-checkbox-and-widget'),
          $widgetContainer = $card.find('.widget-container'),
          $research = $card.find('.research'),
          $placeholderWidgetContainer =
            $("<div class='placeholder-widget-container text-center'" +
                   "style='min-height:128px'>" +
              "</div>"),
          $linkedinWidgetContainer =
            $("<div class='linkedin-widget-container hidden text-center' " +
                   "style='min-height:128px;position:relative'>" +
                "<script type='IN/MemberProfile' " +
                        "data-id='" + url + "' " +
                        "data-format='inline' data-related='false' " +
                        "data-width='" + widgetWidth.toString() + "'></script>" +
              "</div>"),
          contributor = {
            first_name: $card.find('.contributor-name').text().trim().split(' ')[0],
            last_name: $card.find('.contributor-name').text().trim().split(' ')[1],
            linkedin_url: url
          },
          newWidgetPostMesgHandler = function ($linkedinWidgetContainer) {
            return function (event) {
              if ($('body').hasClass('stories edit')) {
                // For Chrome, the origin property is in the event.originalEvent object.
                var  origin = event.origin || event.originalEvent.origin,
                     newWidgetId = $linkedinWidgetContainer
                                     .find('iframe').attr('id')
                                     .match(/^\w+(li_gen\w+)_provider/)[1];
                if (origin === "https://platform.linkedin.com" &&
                    event.data.includes('widgetReady')) {
                  var widgetReadyId = event.data.match(/^(\w+)\s/)[1];
                  if (widgetReadyId === newWidgetId) {
                    $linkedinWidgetContainer
                      .css('margin-top', '-128px')  // height of the placeholder container (for overlay)
                      .removeClass('hidden')
                      .closest('.widget-container')
                      .data('linkedin-widget-loaded', true);
                  }
                }  // widgetReady event
              }
            };
          };

        // remove whatever is there
        $widgetContainer.empty();
        $widgetContainer.data('linkedin-widget-loaded', false);

        if (!validUrl(urlInput)) {  // blank or invalid (not currently validating)
          $checkboxAndWidget.addClass('hidden');

          // update the research button
          // TODO: better way to have all this data available
          $.get('/contributions/' + $card.data('contribution-id'), function (contribution, status) {
            if (contribution.role == 'customer') {
              $research.attr('href',
                "//google.com/search?q=" +
                contribution.contributor.first_name + "+" +
                contribution.contributor.last_name + "+" +
                contribution.success.customer.name);
            } else {
              $research.attr('href',
                "//google.com/search?q=" +
                contribution.contributor.first_name + "+" +
                contribution.contributor.last_name + "+");
            }
          }, 'json');
          $research.html("<i class='glyphicon glyphicon-user bip-clickable'></i>");

        } else {
          $checkboxAndWidget.removeClass('hidden');
          $widgetContainer
            .append($placeholderWidgetContainer)
            .append($linkedinWidgetContainer)
            .find('.placeholder-widget-container')
            .append(template({
                      loading: true,
                      contributor: contributor,
                      widgetWidth: widgetWidth
                    }))
            .imagesLoaded(function () {
              // unhide placeholder
              $('.csp-linkedin-widget.hidden').removeClass('hidden');
            });
          window.addEventListener('message', newWidgetPostMesgHandler($linkedinWidgetContainer), false);
          IN.parse();
          setTimeout(function () {
            // $widgetContainer = $card.find('.widget-container');
            // time's up -> remove the post message listener
            window.removeEventListener('message', newWidgetPostMesgHandler, false);
            // did the linkedin widget arrive?
            if ($widgetContainer.data('linkedin-widget-loaded')) {
              // success
            } else {
              // failure
              $placeholderWidgetContainer
                .find('.member-info > p')
                .css('color', 'red')
                .text('Profile data not available');
            }
          }, 8000);
          $research.attr('href', url);
          $research.html("<i class='fa fa-linkedin-square bip-clickable-fa'>");
        }
      })

    // successes - order by customer grouping
    .on('click', '#successes-table tr.group',
      function () {
        var $successes = $('#successes-table').DataTable(),
            currentOrder = $successes.order()[0];
        if (currentOrder[0] === 1 && currentOrder[1] === 'asc') {
          $successes.order([ 1, 'desc' ]).draw();
        }
        else {
          $successes.order([ 1, 'asc' ]).draw();
        }
      })

    // contributors - order by success
    .on('click', '#contributors-table tr.group',
      function (e) {
        var $contributors = $('#contributors-table').DataTable(),
            successIndex = 2,
            currentOrder = $contributors.order()[0];
        if (! $(e.target).is('a') ) {
          if (currentOrder[0] === successIndex && currentOrder[1] === 'asc') {
            $contributors.order([ successIndex, 'desc' ]).draw();
          }
          else {
            $contributors.order([ successIndex, 'asc' ]).draw();
          }
        }
      })

    // contributors child rows
    .on('click', '#contributors-table td.contributor-details',
      function () {
        var $table = $(this).closest('table').DataTable(),
            $tr = $(this).closest('tr'),
            $cRow = $table.row($tr),
            template = _.template($('#contributor-template').html()),
            cId = $tr.data('contribution-id'),
            contribution = app.contributions.find(function (c) {
              return c.id === cId;
            });

        if ($cRow.child.isShown()) {
          $cRow.child.hide();
          $tr.children().last().css('color', '#666');
          $tr.find('td.contributor-name > span').removeClass('shown');
          $tr.removeClass('shown active');
        }
        else {
          $cRow.child( template({ contribution: contribution }) ).show();
          $tr.children().last().css('color', 'white');
          $tr.find('td.contributor-name > span').addClass('shown');
          $tr.find('form input').each(function () {
            $(this).prop('readonly', true);
          });
          loadCspOrPlaceholderWidget($tr.next(), contribution);
          $tr.addClass('shown active');
        }
        $(this).children().toggle();  // toggle caret icons
      })

    .on('click', 'td.contributor-name i',
      function () {
        $(this).closest('tr').next().find('form input').each(
          function () {
            $(this).prop('readonly', false);
          });
      })

    .on('shown.bs.dropdown', '.actions-dropdown',
      function () {
        $(this).closest('tr').addClass('active');
      })

    .on('hidden.bs.dropdown', '.actions-dropdown',
      function () {
        $(this).closest('tr').removeClass('active');
        // $(this).children().last().css('color', '#666');
      });

}

function loadCspOrPlaceholderWidget ($tr, contribution) {

  var widgetWidth = 380,
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

function loadLinkedinWidget ($card) {
  var alreadyLoaded = $card.find('.widget-container').data('linkedin-widget-loaded') ||
                      $card.find('.csp-linkedin-widget');
  if (alreadyLoaded) {
    return false;
  } else {
    var $linkedinWidgetContainer = $card.find('.linkedin-widget-container'),
        $placeholderWidgetContainer = $card.find('.placeholder-widget-container');
    var    url = $linkedinWidgetContainer.data('url'),
        widgetWidth = 322,
        widgetMarginTop = '-' + $card.find('.placeholder-widget-container')
                                     .outerHeight()
                                     .toString() + 'px',
        $widget = $("<script type='IN/MemberProfile' " +
                            "data-id='" + url + "' " +
                            "data-format='inline' data-related='false' " +
                            "data-width='" + widgetWidth.toString() + "'></script>"),
        newWidgetPostMesgHandler = function () {
          if ($('body').hasClass('stories edit')) {
            // For Chrome, the origin property is in the event.originalEvent object.
            var  origin = event.origin || event.originalEvent.origin,
                 newWidgetId = $linkedinWidgetContainer
                                 .find('iframe').attr('id')
                                 .match(/^\w+(li_gen\w+)_provider/)[1];
            if (origin === "https://platform.linkedin.com" &&
                event.data.includes('widgetReady')) {
              var widgetReadyId = event.data.match(/^(\w+)\s/)[1];
              if (widgetReadyId === newWidgetId) {
                $linkedinWidgetContainer
                  .css('margin-top', widgetMarginTop)  // height of the placeholder container (for overlay)
                  .removeClass('hidden')
                  .closest('.widget-container')
                  .data('linkedin-widget-loaded', true);
              }
            }  // widgetReady event
          }
        };  // var declarations
    $linkedinWidgetContainer.append($widget);
    window.addEventListener('message', newWidgetPostMesgHandler, false);
    IN.parse();
    setTimeout(function () {
      if ($card.find('.widget-container').data('linkedin-widget-loaded')) {
        // success (just leave the placeholder; removing or emptying will affect layout)
      } else {
        // failure
        $placeholderWidgetContainer
          .find('.member-info > p')
          .css('color', 'red')
          .text('Profile data not available');
      }
    }, 7000);
    // remove the listener when navigating away from this page
    $(document).one('turbolinks:before-visit', function () {
      window.removeEventListener('message', newWidgetPostMesgHandler, false);
    });
  }
}