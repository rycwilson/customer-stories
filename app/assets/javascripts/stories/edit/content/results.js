
function storiesEditResultsListeners () {

  $(document)
    .on('click', '#curate-story .add-result', function (e) {

      var template = _.template( $('#new-success-result-template').html() ),
      scrollToResult = function ($result) {
        // scroll down if the new result falls below window...
        var bottomOffset = $result.offset().top + $result.height();
        if (bottomOffset > $(window).height()) {
          $('html, body').animate({
            scrollTop: (bottomOffset - $(window).height()) + ($(window).height() / 2)
          }, 400);
        }
      };
      $.when(
        $('#curate-story .success-results ul').append(
          template({
            successId: $(this).closest('form').data('success-id'),
            index: $(this).find('li').length
          })
        )
      ).then(function () {
        $newResult = $('.success-results li').last();
        scrollToResult($newResult);
        // ref: https://stackoverflow.com/questions/8380759 (2nd answer)
        setTimeout(function () { $newResult.find('textarea')[0].focus(); }, 0);
      });
    })

    .on('click', '.success-result .remove-result', function () {
      var $result = $(this).closest('.success-result');
      $result.addClass('to-be-removed');
      $result.find('.save-or-cancel').removeClass('hidden');
      $result.find('input[type="checkbox"]').prop('checked', true);  // _destroy checkbox
    })

    .on('click', '.success-result.to-be-removed .cancel, ' +
                 '.success-result.to-be-removed .remove-result', function () {
      var $result = $(this).closest('.success-result');
      $result.removeClass('to-be-removed');
      $result.find('input[type="checkbox"]').prop('checked', false);  // _destroy checkbox
      $result.find('.save-or-cancel').addClass('hidden');
    })

    .on('click', '.success-result.new-result .cancel', function () {
      $(this).closest('.new-result').remove();
    });

}