
// see also vendor/summernote.js

function dataPlaceholdersListeners () {

  $(document)
    .on('click', '.request-subject .data-placeholders li', function () {
      insertText('invitation_template_request_subject', $(this).data('placeholder'));
    });

}

function insertText (elementId, text) {
  var inputEl = document.getElementById(elementId);
  if (!inputEl) { return; }

  var scrollPos = inputEl.scrollTop;
  var strPos = 0;
  var br = ((inputEl.selectionStart || inputEl.selectionStart == '0') ?
    "ff" : (document.selection ? "ie" : false ) );
  if (br == "ie") {
    inputEl.focus();
    var range = document.selection.createRange();
    range.moveStart ('character', -inputEl.value.length);
    strPos = range.text.length;
  } else if (br == "ff") {
    strPos = inputEl.selectionStart;
  }

  var front = (inputEl.value).substring(0, strPos);
  var back = (inputEl.value).substring(strPos, inputEl.value.length);
  inputEl.value = front + text + back;
  strPos = strPos + text.length;
  if (br == "ie") {
    inputEl.focus();
    var ieRange = document.selection.createRange();
    ieRange.moveStart ('character', -inputEl.value.length);
    ieRange.moveStart ('character', strPos);
    ieRange.moveEnd ('character', 0);
    ieRange.select();
  } else if (br == "ff") {
    inputEl.selectionStart = strPos;
    inputEl.selectionEnd = strPos;
    inputEl.focus();
  }
  inputEl.scrollTop = scrollPos;
}