
function initTooltips () {

  $("[data-toggle='tooltip']").not("[class*='bip-clickable']").tooltip();

  $("[data-toggle='tooltip'][class*='bip-clickable']")
    .tooltip({ delay: { "show": 1800, "hide": 100 } });

  $(document).on('click', "[data-toggle='tooltip'][class*='bip-clickable']", function () {
    $(this).tooltip('hide');
  });

}