
function newSuccessListeners () {

  var $form,
      formIsValid = function () {
        return $('select.new-success.customer').val() &&
          $('#success_name').val() &&
          (
            $('select.new-success.referrer').val() !== '0' ||
            (
              $('#new-success-form [id*="first_name"]').val() &&
              $('#new-success-form [id*="last_name"]').val() &&
              $('#new-success-form [id*="email"]').val()
            )
          );
      },

      validateForm = function () {
        return formIsValid() ? $('button[type="submit"]').prop('disabled', false) :
                             $('button[type="submit"]').prop('disabled', true);
      },

      disableContributionAttrs = function (disabled) {
        ['referrer_id', 'crowdsourcing_template_id']
          .forEach(function (attribute) {
            // don't disable referrer_id since it's visible, instead blank the [name]
            if (attribute === 'referrer_id') {
              if (disabled) {
                $('#new-success-form #success_contributions_attributes_0_referrer_id').attr('name', '');
              } else {
                $('#new-success-form #success_contributions_attributes_0_referrer_id').attr('name',
                  'success[contributions_attributes][0][referrer_id]');
              }
            // all others disabled
            } else {
              $('#new-success-form #success_contributions_attributes_0_' + attribute).prop('disabled', disabled);
            }
          });
      },
      disableReferrerAttrs = function (disabled) {
        if (disabled) {
          $('#new-success-form .create-referrer').addClass('hidden');
        } else {
          $('#new-success-form .create-referrer').removeClass('hidden');
        }
        ['first_name', 'last_name', 'email', 'sign_up_code', 'password']
          .forEach(function (attribute) {
            $('#success_contributions_attributes_0_referrer_attributes_' + attribute)
              .prop('disabled', disabled);
        });
      };

  $(document)

    .on('change', 'select.new-success.customer', function () {
      $form = $('#new-success-form');
      customerVal = $(this).val();
      customerId = isNaN(customerVal) ? null : customerVal;

      // update hidden customer_id
      $form.find('#success_customer_id').val(customerId);

      if (customerId) {
        // turn off customer attributes
        $form.find('input[id*="customer_attributes"]').each(function () {
            $(this).prop('disabled', true);
          });
      } else {
        // update and enable customer attributes
        $form.find('input[id*="customer_attributes_id"]').val('');
        $form.find('input[id*="customer_attributes_name"]').val(customerVal);
        $form.find('input[id*="customer_attributes"]').prop('disabled', false);
      }
    })

    .on('change', 'select.new-success.referrer', function () {
      $form = $('#new-success-form');

      // if no referrer provided, disable all attributes
      if ( $(this).val() === '' ) {
        disableContributionAttrs(true);
        disableReferrerAttrs(true);

      // if creating a new referrer with this success,
      // enable contribution and contributor attributes
      } else if ( $(this).val() === '0' ) {
        disableContributionAttrs(false);
        disableReferrerAttrs(false);
        setTimeout(function () {
          $('#new-success-form [id*="referrer_attributes_first_name"]')[0].focus();
          }, 0);

      // if existing referrer, disable contributor attributes
      } else {
        disableContributionAttrs(false);
        disableReferrerAttrs(true);
        // the referrer will be both contributor and referrer for this contribution
        $('#new-success-form #success_contributions_attributes_0_referrer_id')
          .val( $(this).val() );
      }

    })

    .on('input', '#new-success-modal', validateForm)
    .on('change', '#new-success-modal', validateForm)

    .on('change', '#new-success-form input[id*="email"]', function () {
      $form = $('#new-contributor-form');
      $(this).closest('.create-referrer')
             .find('input[id*="password"]').val( $(this).val() );
    })

    // reset modal
    .on('hidden.bs.modal', '#new-success-modal', function () {

      var $customerSelect = $('select.new-success.customer'),
          $referrerSelect = $('select.new-success.referrer');

      $(this).find('form')[0].reset();
      disableContributionAttrs(true);
      disableReferrerAttrs(true);
      $(this).find('.create-referrer').addClass('hidden');
      $(this).find('select').val('').trigger('change');
      $('button[type="submit"][form="new-success-form"] span').css('display', 'inline');
      $('button[type="submit"][form="new-success-form"] i').css('display', 'none');
    })

    // need to listen for the click on the submit button instead of 'submit' on 'new-success-form'
    // => the button is outside the form, linked to it through form= attribute
    // => submit event doesn't bubble up to form, so e.preventDefault() doesn't work
    .on('click', 'button[type="submit"][form="new-success-form"]', function (e) {

      $('button[type="submit"][form="new-success-form"] span').toggle();
      $('button[type="submit"][form="new-success-form"] .fa-spinner').toggle();

      // if a referrer wasn't selected, hide the contribution attributes
      // so a contribution isn't created
      if ( $('select.new-success.referrer').val() === '' ) {
        e.preventDefault();
        disableContributionAttrs(true);
        $('#new-success-form').submit();
      }

    })

    .on('submit', '#new-success-form', function () {
      // console.log( $(this).serializeArray() );
    });
}








