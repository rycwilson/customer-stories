
function initMarketo () {

  if (app.company.subdomain === 'varmour' &&
      $('body').hasClass('stories show')) {

    if (typeof MktoForms2 === 'undefined') {
      $.getScript("//app-ab04.marketo.com/js/forms2/js/forms2.min.js",
          function () {
            MktoForms2.loadForm("//app-ab04.marketo.com", "650-OZW-112", 1157);
          });

    } else {
      MktoForms2.loadForm("//app-ab04.marketo.com", "650-OZW-112", 1157);
    }

  }

}