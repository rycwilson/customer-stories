
function promotedStoryChildRowListeners() {
  var adsPath = function (storyId) {
    return '/stories/' + storyId + '/update_gads';
  };

  $(document)
    .on('click', 'td.toggle-promoted-story-child', function () {
      var $table = $(this).closest('table'),
          $trParent = $(this).closest('tr'),
          $trChild, 
          dt = $table.DataTable(),
          dtRow = dt.row($trParent),
          promotedStory = dtRow.data();
      
      $(this).children('i').toggle();  // toggle caret icons

      if (dtRow.child.isShown()) {
        dtRow.child.hide();
        $trParent.removeClass('shown active');
        $trParent.find('.click-blocker').hide();
        // dt.draw();

      } else {
        dtRow.child(
          _.template($('#promoted-story-child-row-template').html())({
            adsPath: adsPath(promotedStory.id),
            promotedStory: promotedStory
          })
        ).show();
        $trParent.addClass('shown active')
                 .find('td.promoted-story-title .click-blocker, td.status .click-blocker')
                   .show();
        $trChild = $trParent.next();
        $trChild.find('.mini-colors').minicolors({ theme: 'bootstrap' });

        // close other open child rows
        $table.find('tr[data-story-id]').not($trParent).each(function () {
          if (dt.row($(this)).child.isShown()) {
            dt.row($(this)).child.hide();
            $(this).removeClass('shown active');
            $(this).children('td.toggle-promoted-story-child').children().toggle();
          }
        });

        // scroll to center
        window.scrollTo(
          0, 
          $trParent.offset().top - (window.innerHeight / 2) + (($trChild.outerHeight() + $trParent.outerHeight()) / 2)
        );
      }
    })

    .on('input', '[id*="promoted-story-form"]', function () {
      $(this).find('button[type="submit"]').prop('disabled', false);
    })

    .on('input', '[id*="promoted-story-form"] input[type="text"]', function () {
      var $form = $(this).closest('form');
      if ($(this).is('[name*="short_headline"]')) {
        $form.find('[name="story[retarget_ad_attributes][short_headline]"]').val($(this).val());
      } else if ($(this).is('[name*="long_headline"]')) {
        $form.find('[name="story[retarget_ad_attributes][long_headline]"]').val($(this).val());
      } else if ($(this).is('[name*="main_color"]')) {
        $form.find('[name="story[retarget_ad_attributes][main_color]"]').val($(this).val());
      } else if ($(this).is('[name*="accent_color"]')) { 
        $form.find('[name="story[retarget_ad_attributes][accent_color]"]').val($(this).val());
      }
    })

    .on('click', '[id*="promoted-story-form"] .btn-preview', function () {
      var $row = $(this).closest('tr').prev(),
          promotedStory = $('#promoted-stories-table').DataTable().row($row).data(),
          $form = $(this).closest('form'),
          queryString = '?' + decodeURIComponent($form.serialize())
            .split('&')
            .filter(function (param) { return param.includes('story'); })
            .join('&')
            // .replace(/company\[/g, 'defaults[')
            .replace(/#/g, '%23');  // escape hex color values
      console.log(queryString)
      window.open('/promote/preview/' + promotedStory.slug + queryString, '_blank');
    });
}