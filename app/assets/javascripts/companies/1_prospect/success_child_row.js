function successChildRowListeners() {  
  $(document)
    .on('click', 'button.edit-customer', editCustomer)
    .on('click', '#successes-table td.toggle-child', toggleChildRow)
    .on('click', '.win-story__copy', function () {
      var isEditMode = typeof $('#win-story-editor').data('summernote') === 'object',
          copyStr = isEditMode ? $editor.summernote('code') : $editor.html(),
          listener = function (e) {
            e.clipboardData.setData("text/html", copyStr);
            e.clipboardData.setData("text/plain", copyStr);
            e.preventDefault();
          };
      document.addEventListener("copy", listener);
      document.execCommand("copy");
      document.removeEventListener("copy", listener);
    })

    // Catch Hook to Sheets: https://hooks.zapier.com/hooks/catch/***REMOVED***/***REMOVED***/
    // Catch Hook to Slack: https://hooks.zapier.com/hooks/catch/***REMOVED***/***REMOVED***/
    // .on('click', '#win-story-zapier-modal .slack button', function () {
    //   var successId = $('tr.shown').data('success-id'),
    //       webhookUrl = $(this).prev().val();

    //   $.ajax({
    //     url: `/successes/${successId}`,
    //     method: 'get',
    //     dataType: 'json'
    //   })
    //     .done(function (data, status, xhr) {
    //       // console.log(data)
    //       $.ajax({
    //         url: webhookUrl,
    //         method: 'post',
    //         data: {
    //           customer: {
    //             name: data.customer.name,
    //             description: data.customer.description,
    //             logo_url: data.customer.logo_url
    //           },
    //           win_story_html: data.win_story_html,
    //           win_story_text: data.win_story_text,
    //           win_story_markdown: data.win_story_markdown
    //         }
    //       })
    //         .done(function (data, status, xhr) {})
    //     })
    // })

  // fetches a script that initializes the customer modal
  function editCustomer(e) {
    e.stopImmediatePropagation();   // prevent row group sorting
    const btn = this;
    
    // dynamically add and remove the spin behavior so that the page isn't full of perpetually spinning elements
    const toggleSpinner = () => btn.lastElementChild.children[0].classList.toggle('fa-spin');
    const loadingTimer = setTimeout(() => {
      toggleSpinner();
      btn.classList.add('still-loading');
    }, 1000);
    btn.classList.add('loading');
    
    // setting X-Requested-With allows the js request without an InvalidCrossOriginRequest error  
    // https://api.rubyonrails.org/classes/ActionController/RequestForgeryProtection.html
    // see bottom answer: https://stackoverflow.com/questions/29310187/rails-invalidcrossoriginrequest
    fetch(`/customers/${btn.dataset.customerId}/edit`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      }
    }).then(res => {
        clearTimeout(loadingTimer);
        return res.text();
      })
      .then(txt => eval(txt))   // run the response script
      .catch(error => console.error(error))
      .finally(() => {
        btn.classList.remove('loading', 'still-loading');
        toggleSpinner();
      });
  }

  function toggleChildRow(e) {
    const table = document.getElementById('successes-table');
    const dt = $(table).DataTable();
    const td = this;
    const tr = td.parentElement;
    const success = dt.row(tr).data();
    const isShown = dt.row(tr).child.isShown();
    const form = isShown && document.getElementById(`success-form-${success.id}`);
    const _editor = form && form.querySelector('.win-story__summernote');
    let childRow;
    const openChildRow = () => {
      dt.row(tr).child(childRowPlaceholderTemplate(success), 'child-row').show();
      childRow = tr.nextElementSibling;
      childRow.scrollIntoView({ block: 'center' });
    };
    const closeChildRow = () => dt.row(tr).child.hide();
    if (isShown) {
      form.classList.contains('has-changes') ? confirmUnsavedChanges(closeChildRow) : closeChildRow();
    } else {
      const loadingTimer = setTimeout(() => childRow.querySelector('.win-story__summernote').classList.add('loading'), 1000);
      fetch(`/successes/${success.id}/edit`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      }).then(res => {
          clearTimeout(loadingTimer);
          return res.text();
        })
        .then(txt => eval(txt));
      
      openChildRow();
      // closeInactiveChildRows(table, dt, tr);
    }
  }

  function closeInactiveChildRows(table, dt, activeRow) {
    $(table).find('tr[data-success-id]').not(activeRow).each((i, tr) => {
      if (dt.row(tr).child.isShown()) {
        dt.row(tr).child.hide();
        tr.children('td.toggle-child button').click();
      }
    });
  }

  function confirmUnsavedChanges(closeChildRow) {
    bootbox.confirm({
      size: 'small',
      className: 'confirm-unsaved-changes confirm-unsaved-changes--win-story',
      closeButton: false,
      message: `
        <div>
          <i class="fa fa-warning"></i>&nbsp;&nbsp;&nbsp;
          <div>Unsaved changes will be lost</div>
        </div>
      `,
      buttons: {
        confirm: {
          label: 'Continue',
          className: 'btn-default'
        },
        cancel: {
          label: 'Cancel',
          className: 'btn-default'
        }
      },
      callback: (confirmed) => { if (confirmed) closeChildRow(); }
    });
  }

  // use a skeleton version of the child row template as a placeholder while loading
  // see views/successes/win_story_form
  function childRowPlaceholderTemplate(success) {
    return `
      <div class="success-form">
        <div class="win-story">
          <div class="win-story__header">
            <label>Win Story</label>
            <div>
              <button type="button" class="btn-expand" disabled>
                <i class="fa fa-expand"></i>
                <span>Max</span>
              </button>
              <button type="button" class="btn-edit" disabled>
                <i class="fa fa-pencil"></i>
                <span>Edit</span>
              </button>
              <button type="button" class="btn-copy" disabled>
                <i class="fa fa-clipboard"></i>
                <span>Copy</span>
              </button>
              <!-- <button type="button" class="btn-email" disabled>
                <i class="fa fa-envelope-o"></i>
                <span>Email</span>
              </button> -->
            </div>
          </div>
          <div class="win-story__summernote form-control" style="overflow:auto; position:relative">
            <div class="spinner"><i class="fa fa-spin fa-circle-o-notch"></i></div>
          </div>
          <div class="win-story__footer text-right hidden">
            <button class="btn btn-sm btn-success text-center mark-completed" disabled>
              Mark as Completed
            </button>
          </div>
        </div>
        <div class="success-form__contacts">
          <label for="curator-name">Curator</label>
          <p class="curator-name">${success.curator.full_name}</p>
        </div>
      </div>
    `
  }
}