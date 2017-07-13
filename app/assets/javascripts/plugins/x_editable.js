
// define the plugin on the a tag instead of td, as latter will hose table styling
function initXeditable () {

  $('td.sponsored-story-title a').each(function () {

    $(this).editable({
      type: 'textarea',
      model: 'adwords',
      name: 'long_headline',
      url: '/stories/' + $(this).data('pk') + '/promote',
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
        $.ajax({
          url: '/stories/' + $(this).data('pk') + '/adwords',
          method: 'put',
          data: { long_headline_changed: true },
          dataType: 'script'
        });
      },
      rows: 3
    });
  });

  // $('td.email-template a').each(function () {
  //   $(this).editable({
  //     type: 'select2',
  //     model: 'contribution',
  //     name: 'template',
  //     url: '/contributions/' + $(this).data('pk'),
  //     pk: $(this).data('pk'),
  //     mode: 'inline',
  //     ajaxOptions: {
  //       type: 'put',
  //       dataType: 'json'
  //     },
  //     success: function (response) {
  //       console.log(response);
  //     }
  //   });
  // });

}