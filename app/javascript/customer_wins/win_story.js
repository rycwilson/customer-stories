import { distinctObjects } from '../util';

// use a skeleton version of the child row template as a placeholder while loading
// see views/successes/win_story_form
export function childRowPlaceholderTemplate(curatorName) {
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
        <p class="curator-name">${curatorName}</p>
      </div>
    </div>
  `
}

export function summernoteConfig(height, contributions, answers) {
  console.log('summernote height', height)
  return {
    height,
    // dialogsInBody: true,
    focus: true,
    toolbar: [
      ['font', ['bold', 'italic', 'underline']], //, 'clear']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['customButton', ['contributionsDropdown', 'placeholdersDropdown']],
      // code editor is handy in development
      // ['view', <%= Rails.env.development? ? ['codeview'] : [] %>],
    ],
    buttons: {
      contributionsDropdown: initDropdown.bind(null, 'contributions', contributions, answers),
      placeholdersDropdown: initDropdown.bind(null, 'placeholders', contributions, answers)
    },
    callbacks: {
      // without this, insertion of a new line doesn't trigger input; critical for inserting placeholders
      onInit: (summernote) => {
        console.log('summernote', summernote)
        // convert jquery elements to native elements
        // (note the wrapping parend syntax since these variables are already declared)
        // ({ codable, editable, editingArea, editor, statusbar, toolbar } = (
        //   Object.fromEntries(Object.entries(summernote).map(([key, element]) => [key, element[0]]))
        // ));
        const setMaxDropdownHeight = () => {
          const dropdownMenus = toolbar.querySelectorAll('.dropdown-menu.summernote-custom');
          for (ul of dropdownMenus) ul.style.maxHeight = `${0.95 * editable.clientHeight}px`;
        }
        // setMaxDropdownHeight();
        // observeEditor(note, editable, setMaxDropdownHeight);
        // depopulatePlaceholders();
        // $(editable).on('click', (e) => $(note).summernote('saveRange'));
        // initCustomToolbar(toolbar.querySelector('.note-customButton'));
        // tr.scrollIntoView();
        // form.querySelector('.btn-copy').disabled = true;
      },
      onEnter: function (e) {
        // $(this).summernote('pasteHTML', '<br></br>');
        // e.preventDefault();
      },
      onFocus: function (e) {},
      onPaste: function () {},
      onChange: function (content) {}
    }
  }
}

function initDropdown(type, contributions, answers, context) {
  const questions = distinctObjects(answers.map(answer => answer.question), 'id');
  const ui = $.summernote.ui;
  const buttonGroup = ui.buttonGroup([
    ui.button({
      className: `btn btn-default dropdown-toggle ${type}`,
      //tooltip: 'Insert contributions',
      data: { toggle: 'dropdown', placement: 'top' },
      contents: (
        `${type === 'contributions' ? 'Contributions' : 'Placeholders'}&nbsp;&nbsp;<span class="caret"></span>`
      )
      // tooltip: 'Insert a data placeholder'
    }),
    ui.dropdown({
      className: `summernote-custom dropdown-menu-right ${type}`,
      contents: dropdownTemplate(type, contributions, questions),
      // contents: type === 'contributions' ? 
      //   "<%= j render('successes/win_story_dropdown_menu', { success: @success, type: 'contributions' }) %>" : 
      //   "<%= j render('successes/win_story_dropdown_menu', { success: @success, type: 'placeholders' }) %>",
      callback: ($dropdown) => {
        $dropdown[0].querySelectorAll('a').forEach(link => {
          link.addEventListener('click', (e) => {
            const li = link.parentElement;
            const isContributionsDropdown = li.parentElement.classList.contains('contributions');
            const isPlaceholdersDropdown = li.dataset.placeholder;
            let pasteHtml;
            if (isContributionsDropdown && li.dataset.contributionId) {
              pasteHtml = individualContributionTemplate(li.dataset.contributionId);
            } else if (isContributionsDropdown && li.dataset.questionId) {
              pasteHtml = groupContributionTemplate(li.dataset.questionId);
            } else if (isPlaceholdersDropdown) {
              pasteHtml = li.dataset.placeholder; 
            }
            $(note).summernote('restoreRange');   // restore cursor position
            $(note).summernote('pasteHTML', pasteHtml)
            $(note).summernote('saveRange');  // save cursor position
          });
        });
      }
    })
  ]);
  return buttonGroup.render();   // return button as jquery object
}

function dropdownTemplate(type, contributions, questions) {
  const individualItem = (contribution) => {
    const link = `<a href="javascript:;">${contribution.contributor.full_name}</a>`;
    const placeholder = type === 'placeholders' && `
      <div class='placeholder' data-contribution-id='${contribution.id}' contenteditable='false'>
        [Individual Contribution: ${contribution.contributor.full_name}]
      </div><br>
    `;
    return type === 'contributions' ? 
      `<li data-contribution-id="${contribution.id}">${link}</li>` :
      `<li data-placeholder="${placeholder}">${link}</li>`;
  };
  const groupItem = (question) => {
    const link = `<a href="javascript:;">${question.question}</a>`;
    const placeholder = type === 'placeholders' && `
      <div class='placeholder' data-question-id='${question.id}' contenteditable='false'>
        [Group Contribution: ${question.question}]
      </div><br>
    `;
    return type === 'contributions' ? 
      `<li data-question-id="${question.id}">${link}</li>` :
      `<li data-placeholder="${placeholder}">${link}</li>`;
  }
  return `
    <li class="dropdown-section">Individual Contributions</li>
    ${contributions.map(contribution => individualItem(contribution)).join(' ')}
    <li class="divider" role="separator"></li>
    <li class="dropdown-section">Group Contributions</li>
    ${questions.map(question => groupItem(question)).join(' ')}
  `;
}
