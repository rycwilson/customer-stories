
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