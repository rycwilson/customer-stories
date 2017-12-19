
function initTooltips () {

  $('[data-toggle="tooltip"]:not(#crowdsourcing-templates [data-toggle="tooltip"])').tooltip();

  $('#crowdsourcing-templates [data-toggle="tooltip"]').tooltip({
    container: 'body',
    delay: {
      show: 1000,
      hide: 0
    }
  });

}