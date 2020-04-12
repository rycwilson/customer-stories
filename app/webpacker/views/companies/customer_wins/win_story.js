
import Rails from '@rails/ujs';
import { scrollToChildRow } from '../tables';
import * as editor from './ws_editor';

let $editor, $form, $submitBtn, $htmlInput, $textInput, $markdownInput;
let contributionsQandA;

export default {
  addListeners() {
    $(document)
      .on('click', '.win-story-actions__expand', expandCollapse)
      .on(
        'click', 
        '.win-story-actions__edit', 
        function (e) { 
          // debugger;
          const $btn = $(this);
          editor.toggleMode($btn, contributionsQandA) 
        }
      )
      .on('click', '.win-story-actions__copy', copyWinStory)
      .on('click', '.win-story-actions__email', (e) => {
        // var isEditMode = typeof $('#win-story-editor').data('summernote') === 'object',
        //     winStoryHtml = isEditMode ? $editor.summernote('code') : $editor.html();
        // $('#win-story-email-editor').summernote('code', winStoryHtml);
        // $('#win-story-email-modal').modal('show');
      })
      .on('click', '[id*="success-form-"] button[type="submit"]', submitForm)
      .on('click', '#win-story-zapier-modal .slack button', postToZapier)
      .on('click', '[data-target="#add-template-recipients"]', (e) => {
        $(e.target).find('i').toggle();
      })

      // scroll boundaries (removed these: #win-story-editor, .note-editable)
      // .on('wheel', '.dropdown-menu.summernote-custom', function (e) {
      //   const maxY = $(this).prop('scrollHeight') - $(this).prop('offsetHeight');
      //   // If this event looks like it will scroll beyond the bounds of the element,
      //   // prevent it and set the scroll to the boundary manually
      //   if ($(this).prop('scrollTop') + e.originalEvent.deltaY < 0 ||
      //       $(this).prop('scrollTop') + e.originalEvent.deltaY > maxY) {
      //     e.preventDefault();
      //     $(this).prop(
      //       'scrollTop', 
      //       Math.max(0, Math.min(maxY, $(this).prop('scrollTop') + e.originalEvent.deltaY))
      //     );
      //   }
      // });
  },
  load(success) {
    $.when(...getWinStory(success.id))
      .done((res1, res2) => {
        if (res1[0].win_story_html) {
          renderWinStory(res1[0].win_story_html, res1[0].win_story_completed);
        }
        contributionsQandA = res2[0];
      })
  }
}

function getWinStory(successId) {
  return [
    $.ajax({
      url: `/successes/${ successId }`,
      method: 'get',
      dataType: 'json'
    }),
    $.ajax({
      url: `/successes/${ successId }/contributions`,
      method: 'get',
      data: { win_story: true },
      dataType: 'json'
    })
  ];
}

function renderWinStory(html, isCompleted) {
  getDomObjects();
  $editor.html(html)
  $form.find('input[name="success[win_story_completed]"]')
         .val(isCompleted);
  if (!isCompleted) $submitBtn.prop('disabled', false).show();
}

function getDomObjects() {
  $editor = $('#win-story-editor');
  $form = $('.success-form');
  $submitBtn = $form.find('button[type="submit"]');
  $htmlInput = $form.find('[name="success[win_story_html]"]');
  $textInput = $form.find('[name="success[win_story_text]"]');
  $markdownInput = $form.find('[name="success[win_story_markdown]"]');
}

function expandCollapse(e, isAutoExpand) {
  const $btn = $(this);
  const isExpansion = !$editor.hasClass('expanded');
  const isEditMode = $editor.attr('contenteditable') === 'true';
  
  // the only way to resize with the editor open is to destroy and reinit
  // (but don't proceed if this is an automatic expansion due to clicking Edit button)
  if (isEditMode && !isAutoExpand) {
    $editor.summernote('destroy');
    editor.init( 
      contributionsQandA,
      isExpansion ? editor.expandedHeight(true) : editor.collapsedHeight() 
    )
  } else {
    $editor.css(
      'height',
      isExpansion ? editor.expandedHeight(isEditMode) : editor.defaultHeight
    );
  }
  $editor.toggleClass('expanded');
  scrollToChildRow();
  $btn.find('i').toggle();
  $btn[0].blur();
}

function copyWinStory(e) {
  const isEditMode = $editor.attr('contenteditable') === 'true';
  const copyStr = isEditMode ? $editor.summernote('code') : $editor.html();
  const listener = (e) => {
    e.clipboardData.setData('text/html', copyStr);
    e.clipboardData.setData('text/plain', copyStr);
    e.preventDefault();
  };
  document.addEventListener('copy', listener);
  document.execCommand('copy');
  document.removeEventListener('copy', listener);
}

// TODO
function submitForm(e) {
  e.preventDefault();
  e.stopImmediatePropagation();

  // ignore if the button is disabled or has already been submitted
  if ($submitBtn.hasClass('disabled') || $form.data('submitted')) {
    // e.preventDefault();
    // e.stopImmediatePropagation();
    return false;
  }

  const isEditMode = $editor.attr('contenteditable') === 'true';
  const markedAsCompleted = !isEditMode;  // submitting from view mode == marking as completed
  const winStoryHtml = isEditMode ?
    editor.populatePlaceholders($editor.summernote('code'), contributionsQandA) :
    $editor.html();

  // set hidden input fields
  $htmlInput.val(winStoryHtml);
  $textInput.val(
    $(winStoryHtml.replace(/<\/p>/g, "</p>\r\n"))    // add line breaks after paragraphs (summernote doesn't)
      .wrapAll('<div class="wrapper"></div>').parent()
      .text()
  );
  $markdownInput.val(
    $(winStoryHtml).wrapAll('<div class="wrapper"></div>').parent()
      .htmlClean()
      .html()
      .replace(/<i>/, " <i>")       // preserve spaces around italicized text (htmlClean will have removed)
      .replace(/<\/i>/, "<\/i> ")
  );

  if (markedAsCompleted) {
    $('input[name="success[win_story_completed]"]').val('true');
    $form.find('span.mark-completed, i.fa-spin').toggle();
  } else {
    $form.find('span.save-changes, i.fa-spin').toggle();
  }

  // disallow toggling either the child row or view/edit mode
  $('#successes-table td.toggle-nested-row').addClass('disabled');
  $('button.win-story-actions__edit').prop('disabled', true);

  $form.attr('data-submitted', 'true');
  Rails.fire($form[0], 'submit')
}

// Catch Hook to Sheets: https://hooks.zapier.com/hooks/catch/***REMOVED***/***REMOVED***/
// Catch Hook to Slack: https://hooks.zapier.com/hooks/catch/***REMOVED***/***REMOVED***/
function postToZapier(e) {
  const webhookUrl = $(this).prev().val();
  $.ajax({
    url: `/successes/${ $('tr.shown').data('success-id') }`,
    method: 'get',
    dataType: 'json'
  })
    .done((data, status, xhr) => {
      // console.log(data)
      $.ajax({
        url: webhookUrl,
        method: 'post',
        data: {
          customer: {
            name: data.customer.name,
            description: data.customer.description,
            logo_url: data.customer.logo_url
          },
          win_story_html: data.win_story_html,
          win_story_text: data.win_story_text,
          win_story_markdown: data.win_story_markdown
        }
      })
        .done(function (data, status, xhr) {
          // console.log(data)
          // console.log(status)
          // console.log(xhr)
        })
    })
}