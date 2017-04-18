
// define the plugin on the a tag instead of td, as latter will hose table styling
function initXeditable () {

  $('td.sponsored-story-title a').each(function () {
    $(this).editable({
      type: 'textarea',
      model: 'story',
      name: 'sponsored_story_title',
      url: '/stories/' + $(this).data('pk'),
      pk: $(this).data('pk'),
      title: 'Sponsored story title',
      // inputclass: 'sponsored-story-title-editable',
      mode: 'inline',
      validate: function (title) {
        if (title.length > 80) {
          return "Max 80 characters";
        }
      },
      ajaxOptions: {
        type: 'put',
        dataType: 'json'
      },
      success: function (response, newValue) {

      },
      rows: 3,
      // showbuttons: false
      // params: function (params) {

      // }

    });
  });

}