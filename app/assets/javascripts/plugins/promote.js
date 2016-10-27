
function initAdRoll () {

  if (app.env === 'production' && app.company.name === 'vARMOUR' &&
      ($('body').hasClass('stories index') || $('body').hasClass('stories show')) &&
      app.current_user === null) {

    window.adroll_adv_id = window.adroll_adv_id || "WZHVL3T2BFD67DGPDZXPOR";
    window.adroll_pix_id = window.adroll_pix_id || "S3NNBWGIABFTFAG3BRHH7P";

    if (typeof __adroll === 'undefined') {
      $.getScript('//s.adroll.com/j/roundtrip.js');
    }

  } else {

    window.adroll_adv_id = window.adroll_pix_id = null;

  }

}