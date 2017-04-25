
function promoteListeners () {

  $(document)
    //
    // get adwords campaign / ad group / ad data when navigating to Promote
    .on('click', 'a[href="#promote-panel"]',
      function () {

        // $.getScript("https://adwords-displayads.googleusercontent.com/da/b/preview.js?client=dab-external-preview&obfuscatedCustomerId=3224978778&adGroupId=0&creativeId=189302204873&showInfoMessages=true&hl=en_US&showMulPreview=true&showVariations=true&showVariations=true&sig=ACiVB_yOr05R_pFJ9YPeqQAsfAlKp6Qzgw")

        // $.ajax({
        //   url: '/adwords/previews',
        //   method: 'get',
        //   data: {
        //     story_title: $('#ads-preview-story-select').find('option:first-of-type').text()
        //   },
        //   dataType: 'script'
        // });
      })

    // manually hide the tooltip when navigating away (since it has container: body)
    .on('mouseout', '#promote-settings-tab-pane',
      function () {
        $('[data-toggle="tooltip"]').tooltip('hide');
      })

    // ad previews - separate window
    .on('click', '.preview-window a',
      function () {
        var storyId = $(this).closest('tr').data('story-id');
        window.open('/stories/' + storyId +
                    '/sponsored_story_preview', '_blank');
      })

    .on('click', 'button.new-adwords-image',
      function () {
        var template = _.template( $('#adwords-image-template').html() );

        $('ul.adwords-images')
          .append( template() );

        $('li.new-adwords-image input[type="file"]')[0].click();

      })

    .on('change.bs.fileinput', 'li.new-adwords-image',
      function () {
        $(this)
          .removeClass('hidden new-adwords-image')
          .find('input[type="file"]').addClass('hidden');
      })

    .on('click', 'li.adwords-image span.remove',
      function () {
        $(this).toggleClass('remove-image');
        $(this).closest('.fileinput').children('.thumbnail')
               .toggleClass('remove-image');
      });

}











