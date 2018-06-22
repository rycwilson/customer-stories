
function initTooltips () {

  $('[data-toggle="tooltip"]:not(#crowdsource-settings [data-toggle="tooltip"])').tooltip();

  $('#crowdsource-settings [data-toggle="tooltip"]').tooltip({
    container: 'body',
    delay: {
      show: 1000,
      hide: 0
    }
  });

}