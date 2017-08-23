
function companyProfileListeners() {

  // CSP test-colors-btn
  var defaultHeaderStyle = "background:linear-gradient(45deg, #FBFBFB 0%, #85CEE6 100%);color:#333333;",
      defaultColorLeft = '#fbfbfb',
      defaltColorRight = '#85cee6',
      defaultTextColor = '#333333';

  $(document)

    .on('click', '#test-colors-btn',
      function () {
        var color1 = $('input#company_header_color_1').val(),
            color2 = $('input#company_header_color_2').val(),
            headerTextColor = $('input#company_header_text_color').val();
        $('.navbar, .logo-upload .thumbnail').css(
            'background', 'linear-gradient(45deg, ' + color1 + ' 0%, ' + color2 + ' 100%)');
        $('.navbar').css('color', headerTextColor);
      })
      // Dynamically change the max-height of the select box
      //   (a static setting doesn't work for some reason)

    .on('select2:open', '#company-profile',
      function () {
        $(".select2-container--bootstrap .select2-results > .select2-results__options").css('max-height', 0);
      })

    .on('click', '#restore-colors-btn, #profile-form-reset',
      function () {
        var headerStyle = app.company ? app.company.header_style : defaultHeaderStyle,
            colorLeft = app.company ? app.company.header_color_1 : defaultColorLeft,
            colorRight = app.company ? app.company.header_color_2 : defaultColorRight,
            textColor = app.company ? app.company.header_text_color : defaultTextColor;
        if (this.id === 'restore-colors-btn') {
          $('.navbar, .logo-upload .thumbnail').attr('style', headerStyle);
        }
        $('#company_header_color_1').minicolors('value', colorLeft);
        $('#company_header_color_2').minicolors('value', colorRight);
        $('#company_header_text_color').minicolors('value', textColor);
      });

}