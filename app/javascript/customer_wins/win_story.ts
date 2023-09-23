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

export function summernoteConfig(summernoteCtrl, height, contributions, answers) {
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
        // console.log('summernote', summernote)

        // convert jquery elements to native elements
        const { codable, editable, editingArea, editor, statusbar, toolbar } = (
          Object.fromEntries(Object.entries(summernote).map(([key, element]) => [key, element[0]]))
        );
        summernoteCtrl.dispatch('init', { detail: { codable, editable, editingArea, editor, statusbar, toolbar } })

        // const setMaxDropdownHeight = () => {
        //   const dropdownMenus = toolbar.querySelectorAll('.dropdown-menu.summernote-custom');
        //   for (ul of dropdownMenus) ul.style.maxHeight = `${0.95 * editable.clientHeight}px`;
        // }
        // setMaxDropdownHeight();
        // observeEditor(note, editable, setMaxDropdownHeight);

        depopulatePlaceholders(editable);
        initCustomToolbar(toolbar.querySelector('.note-customButton'), contributions.length);
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

export function populatePlaceholders(html, contributions, answers) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  [...wrapper.getElementsByClassName('placeholder')].forEach(placeholderEl => {
    placeholderEl.outerHTML = placeholderEl.dataset.questionId ?
      groupContributionTemplate(placeholderEl.dataset.questionId, contributions, answers, placeholderEl) :
      individualContributionTemplate(placeholderEl.dataset.contributionId, contributions, answers, placeholderEl);
  });
  return wrapper.innerHTML;
}

function depopulatePlaceholders(editable) {
  [...editable.getElementsByClassName('group-contribution'), ...editable.getElementsByClassName('individual-contribution')]
    .forEach(population => {
      if (population.dataset.placeholder) population.outerHTML = population.dataset.placeholder;
    });
}

export function individualContributionTemplate(contributionId, contributions, answers, placeholderEl) {
  const contribution = contributions.find(c => c.id == contributionId);
  const cAnswers = answers.filter(a => a.contribution_id == contributionId);
  const questionAnswerTemplate = (answer) => {
    return !answer.answer ? 
      [] : `
      <li>
        <p>${answer.question.question}</p>
        <p><i>${answer.answer}</i></p>
      </li>
    `;
  }
  return `
    <div 
      class="individual-contribution" 
      data-contribution-id="${contributionId}" 
      ${placeholderEl ? `data-placeholder="${placeholderEl.outerHTML.replace(/"/g, "'")}"` : ''}">
      <p>${contribution.contributor.full_name}</p>
      <p>${contribution.contributor.title}</p>
      ${cAnswers.length > 0 ?
        `<ul>${cAnswers.flatMap(questionAnswerTemplate).join('')}</ul>` :
        '<div style="color:#d11302">No answers from this contributor</div>'
      }
    </div><br>
  `;
}

export function groupContributionTemplate(questionId, contributions, answers, placeholderEl) {
  let questionText;
  answers.some(answer => {
    if (answer.question.id == questionId) {
      questionText = answer.question.question;
      return true;
    }
  });
  const qAnswers = answers.filter(answer => answer.question.id == questionId);
  const answerTemplate = (answer) => {
    const contribution = contributions.find(c => c.id == answer.contribution_id);
    return `
      <li>
        <p>${contribution.contributor.full_name}</p>
        <p>${contribution.contributor.title}</p>
        <p><i>${answer.answer}</i></p>
      </li>
    `;
  };
  return `
    <div
      class="group-contribution"
      data-question-id="${questionId}"
      ${placeholderEl ? `data-placeholder="${placeholderEl.outerHTML.replace(/"/g, "'")}"` : ''}>
      <p>${questionText}</p>
      ${qAnswers.length > 0 ?
        `<ul>${qAnswers.map(answerTemplate).join('')}</ul>` :
        '<div style="color:#d11302">No answers to this question</div>'
      }
    </div><br>
  `;
}

function initCustomToolbar(customToolbar, hasContributions) {
  const successId = 'CHANGEME'
  if (!hasContributions) customToolbar.querySelectorAll('.note-btn').forEach(btn => btn.disabled = true);
  customToolbar.insertAdjacentHTML(
    'beforeend', `
      <label>Insert</label>
      <button type="button" class="btn btn-help" title="Inserting Contributions">
        <i class="fa fa-fw fa-question-circle-o"></i>
      </button>
    `
  );
  $(customToolbar.querySelector('.btn-help')).popover({
    container: 'body',
    html: true,
    placement: 'left',
    animation: false,
    template: `
      <div class="popover inserting-contributions" role="tooltip">
        <div class="arrow"></div>
        <div class="custom-title">
          <h3 class="popover-title"></h3>
          <button id="close-popover-${successId}" class="close" type="button" aria-label="Close">&times;</button>
        </div>
        <div class="popover-content"></div>
      </div>
    `,
    content: `
      <p>You can insert contributions in their original form or with a placeholder.</p>
      <p>Placeholders are useful for organizing your document while in Edit mode, \
but will preclude any changes to the underlying content.</p>
      <p>Switch to View mode to see the inserted content.</p>
    `,
  });
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
      callback: ($dropdown) => {
        $dropdown.find('a').each((i, link) => {
          link.setAttribute('data-action', 'win-story#pasteContributionOrPlaceholder')
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
