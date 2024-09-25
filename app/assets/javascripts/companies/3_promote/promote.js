
//= require ./promoted_stories
//= require ./gads_form

function promoteListeners () {
  promotedStoriesListeners();
  promoteSettingsListeners();
  $(document)
    // manually hide the tooltip when navigating away (since it has container: body)
    .on('mouseout', '#promote-settings', () => $('[data-toggle="tooltip"]').tooltip('hide'));

    // changing the scroll-on-focus offset for bootstrap validator isn't working,
    // so do this instead...
    // .on('click', 'a[href="#promote-settings"]', function () {
    //   if ($('#company_adwords_short_headline').val() === '') {
    //     var position = $(window).scrollTop();
    //     $('#company_adwords_short_headline').focus();
    //     $(window).scrollTop(position);
    //   }
    // })


    // .on('click', '#gads-set-reset button', function () {
    //   var $btn = $(this),
    //       storyIds = [],
    //       storyResult = function (storyTitle, newGads) {
    //         var errors = newGads.errors;
    //         return '<li class="' + (errors ? 'errors' : 'success') + '">' +
    //                   '<p>' + storyTitle + '</p>' +
    //                   '<p>' + (errors ? errors[0] : 'topic: ' + newGads.topic.ad_id) + '</p>' +
    //                   (errors ? '' : '<p>retarget: ' + newGads.retarget.ad_id + '</p>') +
    //                   // '<p>retarget ad: ' + (errors ? errors[1] : newGads.retarget.ad_id) + '</p>' +
    //                '</li>'
    //       },
    //       resetGads = function () {
    //         if (storyIds.length === 0) {
    //           $btn.prop('disabled', false).children().toggle();
    //           $('#gads-checklist li').removeClass('checked');
    //           $('#promoted-stories-table').DataTable().ajax.reload(function () {
    //             console.log('set/reset complete')
    //           });
    //           return;  // terminate if array exhausted
    //         } else if (storyIds.length)

    //         $.ajax({
    //           url: '/stories/' + storyIds.shift() + '/create_gads',
    //           method: 'put',
    //           dataType: 'json'
    //         })
    //           .done(function (data, status, xhr) {
    //             console.log(data);
    //             var story = data.story,
    //                 newGads = data.newGads;
    //             if ($('#gads-results__wrapper').is(':not(:visible)')) {
    //               $('#gads-results__wrapper').show();
    //             }
    //             $('#gads-results').append(storyResult(story.title, newGads));
    //             // TODO: add to promoted stories table
    //             resetGads();
    //           })
    //       };

    //   $('#gads-checklist li').removeClass('checked unchecked');
    //   $('#gads-results__wrapper').find('li').remove().end().hide();
    //   $btn.prop('disabled', true).children().toggle();
    //   $.ajax({
    //     url: $btn.data('action'),
    //     method: 'get',
    //     dataType: 'json'
    //   })
    //     .done(function (data, status, xhr) {
    //       console.log(data)
    //       if (readyForGads(data.requirementsChecklist)) {
    //         storyIds = data.publishedStoryIds;
    //         resetGads();
    //       } else {
    //         $btn.prop('disabled', false).children().toggle();
    //       }
    //     })

    // })

  // function readyForGads(requirementsChecklist) {
  //   var $items = $('#gads-checklist li');
  //   $items.eq(0).addClass(requirementsChecklist.promote_enabled ? 'checked' : 'unchecked');
  //   $items.eq(1).addClass(requirementsChecklist.default_headline ? 'checked' : 'unchecked');
  //   $items.eq(2).addClass(
  //       requirementsChecklist.square_image &&
  //       requirementsChecklist.landscape_image &&
  //       requirementsChecklist.valid_defaults ? 'checked' : 'unchecked'
  //     );
  //   return $items.toArray().every(function (item) {
  //             return $(item).hasClass('checked') ? true : false;
  //           });
  // };
}