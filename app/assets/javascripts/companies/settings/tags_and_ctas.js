
function storyTagsListeners () {

  $(document).on('change', '.company-tags', function () {
      $('#company-tags-submit, #company-tags-reset').prop('disabled', false);
    });
}

function storyCTAsListeners () {

  var inputsArePresent = function () {
    return ($('#new_cta_link_description').val() !== '' &&
            $('#new_cta_link_display_text').val() !== '' &&
            $('#new_cta_link_url').val() !== '') ||
           ($('#new_cta_form_description').val() !== '' &&
            $('#new_cta_form_display_text').val() !== '' &&
            $('#new_cta_form_html').val() !== '');
  };

  $(document)
    .on('input', '#new-cta-inputs',
      function () {
        if (inputsArePresent()) {
          $('#new-cta-submit, #new-cta-reset').prop('disabled', false);
        } else {
          $('#new-cta-submit, #new-cta-reset').prop('disabled', true);
        }
      })
    .on('click', '#new-cta-form .btn-group input',
      function () {
        $('.link-input,.html-input').toggle();
        $('.link-input,.html-input').val('');
      })
    .on('input', '#new-cta-form',
      function () {
        if ($(this).find('button[type="submit"]').prop('disabled') === false) {
          return false;
        }
        $linkRadio = $(this).find('.btn-group input:first');
        $formRadio = $(this).find('.btn-group input:last');
        if ($linkRadio.prop('checked') &&
            $.makeArray($('.link-input')).every(function (el) {
              return el.value !== '';
            })) {
          $(this).find('button[type="submit"]').prop('disabled', false);
        } else if ($formRadio.prop('checked') &&
                   $.makeArray($('.html-input')).every(function (el) {
                     return el.value !== '';
                   })) {
          $(this).find('button[type="submit"]').prop('disabled', false);
        }
      })
    .on('click', '#story-ctas .glyphicon-remove',
      function () {
        var id = $(this).closest('li').data('cta-id');
        $.ajax({
          url: '/ctas/' + id,
          method: 'delete',
          success: function (data, status, xhr) {
            if (data.isPrimary) {
              $('#primary-cta li')
                .empty().append('<span>Add a primary CTA</span>');
              $('input[type="checkbox"][id="is_primary"]')
                .prop('disabled', false);
            } else {
              $('li[data-cta-id="' + data.id + '"]').remove();
            }
          }
        });
      });
}