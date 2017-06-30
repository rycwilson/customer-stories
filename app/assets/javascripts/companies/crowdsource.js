
function crowdsourceListeners () {

  $(document)
    // no striping for grouped rows, yes striping for ungrouped
    // manipulate via jquery; insufficient to just change even/odd classes
    .on('change', '#toggle-group-by-success, #toggle-group-by-customer',
      function () {
        if ($(this).attr('id') === 'toggle-group-by-success') {
          toggleStriped($('#contributors-table'));
        } else {
          toggleStriped($('#successes-table'));
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
          if (contribution.contributor.linkedin_url) {
            loadCspOrPlaceholderWidget($tr.next(), contribution);
            loadLinkedinWidget($tr.next(), contribution);
          }
          $tr.addClass('shown active');
        }
        $(this).children().toggle();  // toggle caret icons
      })

    .on('click', 'td.success-details',
      function () {
        var $table = $(this).closest('table').DataTable(),
            $tr = $(this).closest('tr'),
            $sRow = $table.row($tr),
            template = _.template($('#success-template').html()),
            sId = $tr.data('success-id');

        if ($sRow.child.isShown()) {
          $sRow.child.hide();
          $tr.children().last().css('color', '#666');
          $tr.removeClass('shown active');
        }
        else {
          $sRow.child( template({}) ).show();
          $tr.children().last().css('color', 'white');
          $tr.addClass('shown active');
        }
        $(this).children().toggle();  // toggle caret icons
      })

    // .on('click', 'td.contributor-name i',
    //   function () {
    //     $(this).closest('tr').next().find('form input').each(
    //       function () {
    //         $(this).prop('readonly', false);
    //       });
    //   })

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
          console.log(event);
          if ( $('body').hasClass('companies show') ) {
            // in Chrome, the origin property is in the event.originalEvent object
            var origin = event.origin || event.originalEvent.origin;
            if ( origin === "https://platform.linkedin.com" &&
                 event.data.includes('widgetReady') ) {
              var newWidgetId = $linkedinWidgetContainer.find('iframe').attr('id'),
                  widgetReadyId = event.data.match(/^(\w+)\s/)[1];
                  console.log('newWidgetId: ', newWidgetId);
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

// manipulate table stripes when alternating between row grouping and no row grouping
function toggleStriped ($table) {

  $table.find('tr.group').toggle();
  $table.toggleClass('table-striped');

  if ( $table.hasClass('table-striped') ) {
    $table.find('tr:not(.group)')
      .each(function (index) {
        $(this).removeClass('even odd');
        $(this).addClass(index % 2 === 0 ? 'even' : 'odd');
        // reset the hover behavior, lest the new background color override bootstrap
        $(this).hover(
          function () { $(this).css('background-color', '#f5f5f5'); },
          function () {
            $(this).css('background-color', index % 2 === 0 ? '#fff' : '#f9f9f9');
          }
        );
      });
    $table.find('tr.even:not(.group)').css('background-color', '#fff');
    $table.find('tr.odd:not(.group)').css('background-color', '#f9f9f9');

  } else {
    $table.find('tr:not(.group)').css('background-color', '#fff');
    $table.find('tr:not(.group)')
      .each(function () {
        $(this).removeClass('even odd');
        // reset the hover behavior, lest the new background color override bootstrap
        $(this).hover(
          function () { $(this).css('background-color', '#f5f5f5'); },
          function () { $(this).css('background-color', '#fff'); }
        );
      });
  }
}