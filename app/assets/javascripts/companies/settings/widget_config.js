
function widgetConfigListeners () {

  $(document)

    .on('change', '[name="widget[show]"]',
      function () {
        if ($(this).val() === 'true') {
          $('.row.widget-show-freq').removeClass('disabled');
          $('.row.widget-show-delay').removeClass('disabled');
          $('.row.widget-hide').removeClass('disabled');
          $('#widget_show_delay').prop('disabled', false);
          $('#widget_show_freq').prop('disabled', false);
          $('[name="widget[hide]"]').prop('disabled', false);
        } else {
          $('.row.widget-show-freq').addClass('disabled');
          $('.row.widget-show-delay').addClass('disabled');
          $('.row.widget-hide').addClass('disabled');
          $('.row.widget-hide-delay').addClass('disabled');
          $('#widget_show_delay').prop('disabled', true);
          $('#widget_show_freq').prop('disabled', true);
          $('#widget_hide_false').click();
          $('[name="widget[hide]"]').prop('disabled', true);
          $('#widget_hide_delay').prop('disabled', true);
        }
      })

    .on('change', '[name="widget[hide]"]',
      function () {
        if ($(this).val() === 'true') {
          $('.row.widget-hide-delay').removeClass('disabled');
          $('#widget_hide_delay').prop('disabled', false);
        } else {
          $('.row.widget-hide-delay').addClass('disabled');
          $('#widget_hide_delay').prop('disabled', true);
        }
      })

    .on('change', '[name="widget[filter]"]',
      function () {
        if ($(this).val() === 'none') {
          $('[id^="widget-filter"]').hide();
        } else if ($(this).val() === 'category') {
          $('[id="widget-filter-category-container"]').show();
          $('[id="widget-filter-product-container"]').hide();
        } else if ($(this).val() === 'product') {
          $('[id="widget-filter-product-container"]').show();
          $('[id="widget-filter-category-container"]').hide();
        }
      })

    // ref http://bootsnipp.com/snippets/featured/input-spinner-with-min-and-max-values
    .on('click', '.spinner .btn:first-of-type',
      function () {
        var widgetAttr = $(this).parent().prev().attr('id');
        var disabledInput =
          ( widgetAttr === 'widget_hide_delay' &&
            $('#widget_hide_delay').prop('disabled') === true ) ||
          ( widgetAttr === 'widget_show_delay' &&
            $('#widget_show_delay').prop('disabled') === true ) ||
          ( widgetAttr === 'widget_show_freq' &&
            $('#widget_show_freq').prop('disabled') === true );
        if (disabledInput) { return false; }
        var btn = $(this);
        var step = (widgetAttr === 'widget_show_freq') ? 1 : 100;
        var input = btn.closest('.spinner').find('input');
        if (input.attr('max') === undefined || parseInt(input.val()) < parseInt(input.attr('max'))) {
          input.val(parseInt(input.val(), 10) + step);
        } else {
          btn.next("disabled", true);
        }
      })

    .on('click', '.spinner .btn:last-of-type',
      function () {
        var widgetAttr = $(this).parent().prev().attr('id');
        var disabledInput =
          ( widgetAttr === 'widget_hide_delay' &&
            $('#widget_hide_delay').prop('disabled') === true ) ||
          ( widgetAttr === 'widget_show_delay' &&
            $('#widget_show_delay').prop('disabled') === true ) ||
          ( widgetAttr === 'widget_show_freq' &&
            $('#widget_show_freq').prop('disabled') === true );
        if (disabledInput) { return false; }
        var btn = $(this);
        var step = (widgetAttr === 'widget_show_freq') ? 1 : 100;
        var input = btn.closest('.spinner').find('input');
        if (input.attr('min') === undefined || parseInt(input.val()) > parseInt(input.attr('min'))) {
          input.val(parseInt(input.val(), 10) - step);
        } else {
          btn.prev("disabled", true);
        }
      })

    .on('click', '#widget-html-btn',
      function () {
        var filterValue = function (type) {
          if (type === 'category' &&
              $('[name="widget[filter]"]:checked').val() === 'category') {
            return $('.widget-filter-category').find(':selected').data('slug');
          } else if (type === 'product' &&
                     $('[name="widget[filter]"]:checked').val() === 'product') {
            return $('.widget-filter-product').find(':selected').data('slug');
          } else {
            return "";
          }
        };
        $('#widget-html').text(
          $('#widget-html').text()
            // .replace(/data-tab-size='.*?'/,
            //   "data-tab-size='" + $('[name="widget[tab_size]"]:checked').val() + "'")
            // .replace(/data-tab-color='.*?'/,
            //   "data-tab-color='" + $('#widget_tab_color').val() + "'")
            // .replace(/data-text-color='.*?'/,
            //   "data-text-color='" + $('#widget_text_color').val() + "'")
            // .replace(/data-delay='.*?'/,
            //   "data-delay='" + $('#widget_delay').val() + "'")
            // .replace(/data-show='.*?'/, "data-show='" +
            //   $('[name="widget[show]"]:checked').val() + "'")
            // .replace(/data-timeout='.*?'/, "data-timeout='" +
            //   $('[name="widget[timeout]"]:checked').val() + "'")
            // .replace(/data-timeout-count='.*?'/,
            //   "data-timeout-count='" + $('#widget_timeout_count').val() + "'")
            .replace(/data-category='.*?'/, "data-category='" + filterValue('category') + "'")
            .replace(/data-product='.*?'/, "data-product='" + filterValue('product') + "'")
        ).css('visibility', 'visible');
        $('#widget-html').parent().find('i').css('visibility', 'visible');
      })

    .on('click', '#html-to-clipboard',
      function () {
        var htmlText = $(this).parent().find('textarea').text();
            $temp = $("<textarea></textarea>");
        $("body").append($temp);
        $temp.text(htmlText).select();
        document.execCommand("copy");
        $temp.remove();
      });

}