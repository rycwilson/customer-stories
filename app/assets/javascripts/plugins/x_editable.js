
// define the plugin on the a tag instead of td, as latter will hose table styling
function initXeditable () {

  $('td.sponsored-story-title a').each(function () {

    $(this).editable({
      type: 'textarea',
      model: 'adwords_config',
      name: 'long_headline',
      url: '/stories/' + $(this).data('pk') + '/adwords_config',
      pk: $(this).data('pk'),
      title: 'Sponsored story title',
      mode: 'inline',
      validate: function (title) {
        if (title.length > 90) {
          return "Max 90 characters";
        }
      },
      ajaxOptions: {
        type: 'put',
        dataType: 'json'
      },
      success: function (response) {
        $.get({
          url: '/adwords/update/' + $(this).data('pk'),
          data: { long_headline_changed: true },
          dataType: 'script'
        });
      },
      rows: 3
    });

  });

}