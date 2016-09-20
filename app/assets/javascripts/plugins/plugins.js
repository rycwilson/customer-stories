
//= require plugins/manifest
//= require plugins/socialshare
//= require plugins/linkedin
//= require plugins/summernote
//= require plugins/masonry
//= require plugins/select2

function constructPlugins () {

  initSelect2();
  initLinkedIn();
  initSocialShare();
  initSummernote();
  initMasonry();

  $("[data-toggle='tooltip']").tooltip();
  $('.best_in_place').best_in_place();
  $('.bs-switch').bootstrapSwitch({ size: 'small' });
  $("input[type='tel']").inputmask("999-999-9999");
  $('.mini-colors').minicolors({ theme: 'bootstrap' });
  /*
    dirtyFields() plugin will apply .dirtyField class to label on input change
    (allows for color change)
    Ensure "for" attribute is present on label tag
    and matches the id attribute of the corresponding input field.
  */
  $('#story-tags-form').dirtyFields();

  $('#activity-feed-btn').popover({
    title: 'Last 7 days',
    placement: 'right',
    html: 'true',
    trigger: 'manual',
    template: '<div class="popover activity-feed-popover" role="tooltip">' +
                '<div class="arrow"></div>' +
                '<div style="position:relative">' +
                  '<h3 class="popover-title"></h3>' +
                  '<button style="z-index:1;position:absolute;top:3px;right:8px" type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                '</div>' +
                '<div class="popover-content"></div>' +
              '</div>'
  });

}

function deconstructPlugins () {
  // Set the data attribute with vanilla js.  Data attributes set via jquery
  // do not persist across turbolinks visits (or don't persist for some unknown reason)
  // TODO: does this apply to *all* select2 boxes?
  $('select').each(function () {

    if ($(this).hasClass('stories-filter')) {
      $(this)[0].setAttribute('data-pre-select', $(this).find(':selected').val());
    }

    $(this).select2('destroy');

  });

  $('.grid').masonry('destroy');

  $("[data-provider='summernote']").summernote('destroy');

  // $('.linkedin-widget span').remove();
}





