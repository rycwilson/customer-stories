
function initTracking () {
  // initGoogle();
  initMarketo();
  // initAdRoll;
}

function initGoogle () {
  // google_conversion_id = 919156278;  // var was removed from original script
  // google_custom_params = window.google_tag_params;  // var was removed
  // google_remarketing_only = true;  // var was removed
  // if (typeof google_trackConversion === 'undefined') {
  //   $.getScript('//www.googleadservices.com/pagead/conversion_async.js');
  // }
}

function initMarketo () {
  // if (app.company.subdomain === 'varmour' &&
  //     $('body').hasClass('stories show')) {

  //   if (typeof MktoForms2 === 'undefined') {
  //     $.getScript("//app-ab04.marketo.com/js/forms2/js/forms2.min.js",
  //         function () {
  //           MktoForms2.loadForm("//app-ab04.marketo.com", "650-OZW-112", 1157);
  //         });

  //   } else {
  //     MktoForms2.loadForm("//app-ab04.marketo.com", "650-OZW-112", 1157);
  //   }

  // }
}

function initAdRoll () {

  if (app.env === 'production' &&
      (app.company.subdomain === 'varmour' || app.company.subdomain === 'trunity') &&
      ($('body').hasClass('stories index') || $('body').hasClass('stories show')) &&
      app.current_user === null) {

    if (app.company.subdomain === 'varmour') {
      window.adroll_adv_id = window.adroll_adv_id || "WZHVL3T2BFD67DGPDZXPOR";
      window.adroll_pix_id = window.adroll_pix_id || "S3NNBWGIABFTFAG3BRHH7P";
    } else {  // trunity
      window.adroll_adv_id = window.adroll_adv_id || "OYBCTHF2DBDYRHEAC5ILVM";
      window.adroll_pix_id = window.adroll_pix_id || "P77666QEWVCZJJXSGS32MX";
    }

    if (typeof __adroll === 'undefined') {
      $.getScript('//s.adroll.com/j/roundtrip.js');
    }

  } else {

    window.adroll_adv_id = window.adroll_pix_id = null;

  }

}