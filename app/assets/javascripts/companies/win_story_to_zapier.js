function successChildRowListeners() {  
  $(document)
    // Catch Hook to Sheets: https://hooks.zapier.com/hooks/catch/***REMOVED***/***REMOVED***/
    // Catch Hook to Slack: https://hooks.zapier.com/hooks/catch/***REMOVED***/***REMOVED***/
    .on('click', '#win-story-zapier-modal .slack button', function () {
      var successId = $('tr.shown').data('success-id'),
          webhookUrl = $(this).prev().val();

      $.ajax({
        url: `/successes/${successId}`,
        method: 'get',
        dataType: 'json'
      })
        .done(function (data, status, xhr) {
          // console.log(data)
          $.ajax({
            url: webhookUrl,
            method: 'post',
            data: {
              customer: {
                name: data.customer.name,
                description: data.customer.description,
                logo_url: data.customer.logo_url
              },
              win_story_html: data.win_story_html,
              win_story_text: data.win_story_text,
              win_story_markdown: data.win_story_markdown
            }
          })
            .done(function (data, status, xhr) {})
        })
    })
}