
import 'summernote';
import { scrollToChildRow } from '../dashboard/tables';
import * as templates from './ws_templates';
import _unescape from 'lodash/unescape';

// these are defined as constants rather than pulling values from the DOM,
// because the values are needed to calculate editor height before
// the editor is rendered, i.e. height is an argument to editor initialization
const wsHeaderHeight = 23;
const wsFooterHeight = 50;
const editorToolbarHeight = 41.3;
const editorFooterHeight = 17;  // .note-status-output + .note-status-bar

let $editor, $form, $submitBtn;

export const defaultHeight = "200px";

export function toggleMode($btn, contributionsQandA) {
  getDomObjects();
  const toEditMode = $editor.attr('contenteditable') === 'false';
  if (toEditMode) {
    init(contributionsQandA, expandedHeight(toEditMode), () => {
      $('.success-form')
        .find('button[type="submit"]')
          .prop('disabled', true)
          .toggleClass('mark-completed save-changes')
          .find('span.save-changes, span.mark-completed')
            .toggle()
            .end()
          .show();
    }); 
  } else {
    saveChanges();
    destroyEditor(contributionsQandA);
    scrollToChildRow();
  }
  if (toEditMode && !$editor.hasClass('expanded')) {
    $('.win-story-actions__expand').trigger('click', true);
  }
  $btn.find('i, span').toggle();  // change button to View
  $btn[0].blur();
}

function getDomObjects() {
  if ([$editor, $form, $submitBtn].some(($el) => typeof $el === 'undefined' )) {
    $editor = $('#win-story-editor');
    $form = $('.success-form');
    $submitBtn = $form.find('button[type="submit"]');
  }
}

export function init(contributionsQandA, height, callback) {
  const customerId = $('tr.shown').data('customer-id');
  // use contenteditable instead of textarea because html can't be renderd in textarea
  $('#win-story-editor')
    .prop('contenteditable', true)
    .summernote({
      height,    // expandedViewHeight($tr, true),
      // dialogsInBody: true,
      focus: true,
      toolbar: [
        ['font', ['bold', 'italic', 'underline']], //, 'clear']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['customButton', ['insertContributions', 'insertPlaceholders']],
        // code editor is handy in development
        // ['view', <%= Rails.env.development? ? ['codeview'] : [] %>],
      ],
      buttons: {
        insertContributions: contentInsertionDropdown('contributions', contributionsQandA),
        insertPlaceholders: contentInsertionDropdown('placeholders', contributionsQandA)
      },
      callbacks: {
        // without this, insertion of a new line doesn't trigger input; critical for inserting placeholders
        onInit: function (summernote) {
          // unable to set this via stylesheets due to dynamic handling by summernote
          $('.note-editor .dropdown-menu.summernote-custom').css({
             'max-height': 0.95 * $('.note-editable').last().outerHeight() + 'px',
             'max-width': 0.9 * $('.note-editable').last().outerWidth() + 'px'
           });
          summernote.editable.on('click', function (e) {
            summernote.note.summernote('saveRange');
          })
          $('.win-story-actions__copy').prop('disabled', true);
          depopulatePlaceholders();
          renderHelpButton();
          if (typeof callback === 'function') callback();
        },
        onEnter: function (e) {
          // $(this).summernote('pasteHTML', '<br></br>');
          // e.preventDefault();
        },
        onFocus: function (e) {
        },
        onPaste: function () {
        },
        onChange: function (content) {
          $('.success-form').find('button[type="submit"]').prop('disabled', false);
        }
      }
    });
}

export function destroyEditor(contributionsQandA) {
  // can't use .note-editor height because it will be 0
  // why do I need to do the .last thing for win story??
  $editor
    .css(
      'height', 
      $editor.hasClass('expanded') ? 
        `${ parseInt($('.form-group.win-story').last().css('height'), 10) 
            - wsHeaderHeight }px` : 
        defaultHeight
    )
    .prop('contenteditable', false)
    .summernote('destroy');  // note this doesn't return $editor => can't chain
  $editor.html( populatePlaceholders( $editor.html(), contributionsQandA ) );
  $('.win-story-actions__copy').prop('disabled', false);
  // $('.mark-completed').removeClass('disabled');
}

export function populatePlaceholders(html, contributionsQandA) {
  const $wrapper = $(html).wrapAll('<div class="wrapper"></div>').parent();
  // const dtContributors = $('#contributors-table').DataTable();

  // customer logo
  // $wrapper.find('.placeholder.customer-logo').each(function () {
  //   var $placeholder = $(this);
  //   $placeholder.replaceWith(
  //     _.template($('#win-story-customer-logo-template').html())({
  //       customer: customer,
  //       placeholder: _.escape($placeholder.wrap('<p/>').parent().html()),
  //       className: $placeholder.attr('class').replace('placeholder', '')
  //     })
  //   );
  // });

  // customer description
  // $wrapper.find('.placeholder.customer-description').each(function () {
  //   var $placeholder = $(this);
  //   $placeholder.replaceWith(
  //     '<p class="customer-description" data-placeholder="' + _.escape($placeholder.wrap('<p/>').parent().html()) + '">' +
  //       customer.description +
  //     '</p>'
  //   );
  // });

  // group contributions
  $wrapper
    .find('.placeholder[data-question-id]')
      .each((index, placeholder) => {
        let questionId = $(placeholder).data('question-id');
        $(placeholder).replaceWith(
          templates.groupContributionTemplate(questionId, contributionsQandA, $(placeholder))
        );
      });
  // individual contributions
  $wrapper
    .find('.placeholder[data-contribution-id]')
      .each((index, placeholder) => {
        let contributionId = $(placeholder).data('contribution-id');
        $(placeholder).replaceWith(
          templates.individualContributionTemplate(contributionId, contributionsQandA, $(placeholder))
        );
      });
  return $wrapper.html();
}

export function expandedHeight(isEditMode) {
  const $tr = $('tr.shown');
  const totalHeight = window.innerHeight;  // the total height available
  const childRowPadding = (
    parseInt($tr.next().children().css('padding-top'), 10) +
    parseInt($tr.next().children().css('padding-bottom'), 10)
  );
  const reservedHeight = (
    $tr.outerHeight() + childRowPadding + wsHeaderHeight + wsFooterHeight +
    (isEditMode ? editorToolbarHeight + editorFooterHeight : 0)
  );
  return totalHeight - reservedHeight;
}

export function collapsedHeight() {
  return parseInt(defaultHeight, 10) - (editorToolbarHeight + editorFooterHeight);
}

function saveChanges() {
  if ($submitBtn.prop('disabled')) {
    $submitBtn.toggleClass('mark-completed save-changes')
    $submitBtn.find('span.mark-completed, span.save-changes').toggle();
    $form.find('input[name="success[win_story_completed]"]').val() === 'true' ?
      $submitBtn.hide() :
      $submitBtn.prop('disabled', false);
  } else {
    $submitBtn.trigger('click');
  }
}

function depopulatePlaceholders() {
  $('.note-editable')
    .find('[data-placeholder]')
      .each((index, placeholder) => {
        $(placeholder).replaceWith( 
          _unescape( $(placeholder).data('placeholder') ) 
        );
      });
}

function renderHelpButton() {
  $('.note-customButton').append(`
    <label class="insert-contributions">Insert</label>
    <button type="button" class="help" data-toggle="popover">
      <i class="fa fa-fw fa-question-circle-o"></i>
    </button>
  `);
  $('.note-customButton button.help').popover({
    container: 'body',
    trigger: 'focus',
    placement: 'left',
    content: "You can insert contributions in their original form or with a placeholder. The latter is useful for organizing your document while in Edit mode, but will preclude any changes to the underlying content. Toggle to the View mode to see the populated/saved content.",
    template: `
      <div class="popover" style="min-width: 400px; role="tooltip">
        <div class="arrow"></div>
        <div class="popover-content"></div>
      </div>
    `
  });
}

function contentInsertionDropdown(type, contributionsQandA) {
  return () => {
    const ui = $.summernote.ui;
    const button = ui.buttonGroup([
      ui.button({
        className: `btn btn-default dropdown-toggle ${ type }`,
        data: {
          toggle: 'dropdown',
          placement: 'top'
        },
        contents: `
          ${ type === 'contributions' ? 'Contributions' : 'Placeholders' }&nbsp;&nbsp;<span class="caret"></span>
        `
        // tooltip: 'Insert a data placeholder'
      }),
      ui.dropdown({
        className: `summernote-custom dropdown-menu-right ${ type }`,
        contents: templates.dropdownMenuTemplate(type, contributionsQandA),
        callback: function ($dropdown) {
          $dropdown.find('li').each((index, li) => {
            $(li).on('click', (e) => {
              const isContributionsDropdown = $dropdown.hasClass('contributions');
              const isPlaceholdersDropdown = $(li).data('placeholder');
              let content;
              if (isContributionsDropdown && $(li).data('contribution-id')) {
                content = templates.individualContributionTemplate(
                  $(li).data('contribution-id'),
                  contributionsQandA,
                  null
                );
              } else if (isContributionsDropdown && $(li).data('question-id')) {
                content = templates.groupContributionTemplate(
                  $(li).data('question-id'),
                  contributionsQandA,
                  null
                );
              } else if (isPlaceholdersDropdown) {
                content = $(li).data('placeholder');
              }
              $editor.summernote('restoreRange');   // restore cursor position
              $editor.summernote('pasteHTML', content)
              $editor.summernote('saveRange');  // save cursor position
            });
          });
        }
      })
    ]);
    return button.render();   // return button as jquery object
  }
}


