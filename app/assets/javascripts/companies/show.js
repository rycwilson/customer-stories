
function companiesShowHandlers () {
  activityFeedHandlers();
  newStoryModalHandlers();
}

function initTemplateEditor () {
  $('.note-editable').attr('contenteditable', 'false');
}

function activityFeedHandlers () {
  $(document)
    .on('click', '#activity-feed-btn', function (e) {
      $(this).html('<i class="fa fa-spinner fa-pulse fa-fw"></i>' +
                   '<span class="sr-only">Loading...</span>');
    })
    .on('ajax:success', '#activity-feed-btn', function (e, data, status, xhr) {
      var target, date, dateFormatted, storyTitle, storyPath, customer, visitor,
          monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      // console.log(data);
      $feedWrapper = $("<div><div class='activity-feed'></div></div>");
      $feed = $feedWrapper.children();
      data.events.forEach(function (event) {
        target = event.target;  // a contribution or story object
        date = new Date(event.timestamp);
        dateFormatted = monthNames[date.getMonth()] + ' ' + date.getDate();
        customer = target.success ? target.success.customer.name : event.customer;
        contributor = target.contributor ? target.contributor.full_name : null;
        curator = target.success ?
                    (target.success.curator ? target.success.curator.full_name : null) : null;
        visitor = event.organization;
        provider = event.provider === 'linkedin' ? 'LinkedIn' :
                    (event.provider === 'twitter' ? 'Twitter' :
                      (event.provider === 'facebook' ? 'Facebook' : null));
        (({
            "contribution_submission": function () {
              storyTitle = target.success.story.title;
              storyPath = target.success.story.csp_edit_story_path;
              $feed.append("" +
                "<div class='feed-item'>" +
                  "<div class='date'>" + dateFormatted + "</div>" +
                  "<div class='text'>" +
                    '<strong>' + contributor + '</strong> submitted ' +
                    (target.contribution ? 'a contribution ' : 'feedback ') +
                    'for the <strong>' + customer + '</strong> story, ' +
                    '<a href="' + storyPath + '">' + storyTitle + '</a>' +
                  "</div>" +
                "</div>");
            },
            "contribution_request_received": function () {
              storyTitle = target.success.story.title;
              storyPath = target.success.story.csp_edit_story_path;
              $feed.append("" +
                "<div class='feed-item'>" +
                  "<div class='date'>" + dateFormatted + "</div>" +
                  "<div class='text'>" +
                    '<strong>' + contributor + '</strong> received and opened a contribution request ' +
                    'for the <strong>' + customer + '</strong> story, ' +
                    '<a href="' + storyPath + '">' + storyTitle + '</a>' +
                  "</div>" +
                "</div>");
            },
            "story_created": function () {
              storyTitle = target.title;
              $feed.append("" +
                "<div class='feed-item'>" +
                  "<div class='date'>" + dateFormatted + "</div>" +
                  "<div class='text'>" +
                    '<strong>' + curator + '</strong> created a story for <strong>' + customer + '</strong>: ' +
                    '\"' + storyTitle + '\"' +
                  "</div>" +
                "</div>");
            },
            "story_published": function () {
              storyTitle = target.title;
              storyPath = target.csp_story_path;
              $feed.append("" +
                "<div class='feed-item'>" +
                  "<div class='date'>" + dateFormatted + "</div>" +
                  "<div class='text'>" +
                    '<strong>' + curator + '</strong> published the <strong>' + customer + '</strong> story, ' +
                    '<a href="' + storyPath + '">' + storyTitle + '</a>' +
                  "</div>" +
                "</div>");
            },
            "story_logo_published": function () {
              storyTitle = target.title;
              $feed.append("" +
                "<div class='feed-item'>" +
                  "<div class='date'>" + dateFormatted + "</div>" +
                  "<div class='text'>" +
                    '<strong>' + curator + ' </strong> published a logo for the <strong>' +
                    customer + '</strong> story, ' + '\"' + storyTitle + '\"' +
                  "</div>" +
                "</div>");
            },
            "story_view": function () {
              storyTitle = target.title;
              storyPath = target.path;
              $feed.append("" +
                "<div class='feed-item'>" +
                  "<div class='date'>" + dateFormatted + "</div>" +
                  "<div class='text'>" +
                    '<strong>' + visitor + '</strong> viewed the <strong>' + customer + '</strong> story, ' +
                    '<a href="' + storyPath + '">' + storyTitle + '</a>' +
                  "</div>" +
                "</div>");
            },
            "story_share": function () {
              storyTitle = target.title;
              storyPath = target.path;
              $feed.append("" +
                "<div class='feed-item'>" +
                  "<div class='date'>" + dateFormatted + "</div>" +
                  "<div class='text'>" +
                    '<strong>' + visitor + '</strong> shared via ' + provider +
                    ' the <strong>' + customer + '</strong> story, ' +
                    '<a href="' + storyPath + '">' + storyTitle + '</a>' +
                  "</div>" +
                "</div>");
            }
        })[event.event])();
      });
      $(this).html('').text('Recent Activity');
      $('#activity-feed-btn')
        .attr('data-content', $feedWrapper.html())
        .popover('show');
    });
}

function newStoryModalHandlers() {
  /*
    Detect changes in new story modal required inputs, and enable
    submit button accordingly.
    'change' event is for the select boxes; 'input' for text box
  */
  $(document).on('change input', '#new-story-modal', function () {
    if ($('#story_customer').val() &&
        $('#story_title').val()) {
      $(this).find("[type='submit']").prop('disabled', false);
    }
    else {
      $(this).find("[type='submit']").prop('disabled', true);
    }
  });

  // reset new story modal form
  $(document).on('hidden.bs.modal', '#new-story-modal', function () {
    // form inputs to default values... (in this case just title)
    $(this).find('form')[0].reset();
    // select2 inputs to default values...
    $('.new-story-customer').select2('val', '');  // single select
    $('.new-story-tags').val('').trigger('change');  // multiple select
  });
}

function adjustPromoCSSChecker () {
  if ($('#promote').hasClass('active')) {
    adjustPromoCSS();
  } else {
    $(document).on('shown.bs.tab', "a[href='#promote-panel']", function () {
      adjustPromoCSS();
    });
  }
}

function adjustPromoCSS () {

  var ad2LogoWidth = parseInt($('.ad2-logo').css('width'), 10);

  $('.ad1-text').each(function () {
    if ($(this).data('text-length') >= 85) {
      $(this).css('font-size', '22px');
    }
  });

  $('.ad2-text').each(function () {
    $(this).css('padding-left', ad2LogoWidth + 20);
    if ($(this).data('text-length') >= 85) {
      $(this).css('font-size', '20px');
      $(this).css('top', '10px');
    } else if ($(this).data('text-length') >= 75) {
      $(this).css('font-size', '22px');
      $(this).css('top', '8px');
    }
  });
}




