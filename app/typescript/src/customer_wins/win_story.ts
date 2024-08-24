import { distinctObjects } from '../utils';
import type SummernoteController from '../controllers/summernote_controller';
import { type CustomSummernoteOptions, onInit as baseInit } from '../summernote';

// use a skeleton version of the child row template as a placeholder while loading
// see views/successes/win_story_form
export function childRowPlaceholderTemplate(curatorName?: string) {
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

export function summernoteConfig(
  ctrl: SummernoteController, height: number, contributions: Contribution[], answers: ContributorAnswer[]
): CustomSummernoteOptions {
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
    ] as Summernote.toolbarDef,
    buttons: {
      contributionsDropdown: initDropdown.bind(null, 'contributions', contributions, answers),
      placeholdersDropdown: initDropdown.bind(null, 'placeholders', contributions, answers)
    },
    callbacks: {
      // without this, insertion of a new line doesn't trigger input; critical for inserting placeholders
      onInit: baseInit(ctrl, (_ctrl: SummernoteController) => {
        // const setMaxDropdownHeight = () => {
        //   const dropdownMenus = toolbar.querySelectorAll('.dropdown-menu.summernote-custom');
        //   for (ul of dropdownMenus) ul.style.maxHeight = `${0.95 * editable.clientHeight}px`;
        // }
        // setMaxDropdownHeight();
        // observeEditor(note, editable, setMaxDropdownHeight);
        depopulatePlaceholders(_ctrl.$editable[0]);
        const customButtonsEl = _ctrl.$toolbar[0].querySelector<HTMLDivElement>('.note-customButton');
        if (customButtonsEl) initCustomToolbar(customButtonsEl, contributions.length);
      }),
      onEnter: function (e: Event) {
        // $(this).summernote('pasteHTML', '<br></br>');
        // e.preventDefault();
      },
      onFocus: function (e: Event) {},
      onPaste: function () {},
      onChange: function (contents: string) {}
    }
  }
}

export function populatePlaceholders(html: string, contributions: Contribution[], answers: ContributorAnswer[]) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  Array.from(wrapper.getElementsByClassName('placeholder')).forEach(placeholderEl => {
    const placeholder: { el: Element, html: HTMLElement } = { el: placeholderEl, html: placeholderEl as HTMLElement };
    const questionId = placeholder.html.dataset.questionId;
    const contributionId = placeholder.html.dataset.contributionId;
    if (questionId) {
      placeholder.html.outerHTML = groupContributionTemplate(questionId, contributions, answers, placeholderEl)
    } else if (contributionId) {
      placeholder.html.outerHTML = individualContributionTemplate(contributionId, contributions, answers, placeholderEl)
    } else {
      return true;  // continue
    }
  });
  return wrapper.innerHTML;
}

function depopulatePlaceholders(editable: HTMLDivElement) {
  const groupContributions = Array.from(editable.getElementsByClassName('group-contribution'));
  const individualContributions = Array.from(editable.getElementsByClassName('individual-contribution'));
  [...groupContributions, ...individualContributions]
    .forEach(population => {
      const popHtml: HTMLElement = population as HTMLElement;
      if (popHtml.dataset.placeholder) popHtml.outerHTML = popHtml.dataset.placeholder;
    });
}

export function individualContributionTemplate(
  contributionId: string, 
  contributions: Contribution[], 
  answers: ContributorAnswer[], 
  placeholderEl?: Element
) {
  const contribution = contributions.find(c => c.id == +contributionId);
  const contributor = contribution?.contributor
  if (!contribution || !contributor) {
    return '<li><p style="color:#d11302"><Missing Contribution data</p></li>';
  }
  const cAnswers = answers.filter(a => a.contribution_id == +contributionId);
  const questionAnswerTemplate = (answer: ContributorAnswer) => {
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
      <p>${contributor.full_name}</p>
      <p>${contributor.title}</p>
      ${cAnswers.length > 0 ?
        `<ul>${cAnswers.flatMap(questionAnswerTemplate).join('')}</ul>` :
        '<div style="color:#d11302">No answers from this contributor</div>'
      }
    </div><br>
  `;
}

export function groupContributionTemplate(
  questionId: string, 
  contributions: Contribution[], 
  answers: ContributorAnswer[], 
  placeholderEl?: Element
) {
  let questionText;
  answers.some(answer => {
    if (answer.question.id == +questionId) {
      questionText = answer.question.question;
      return true;
    }
  });
  const qAnswers = answers.filter(answer => answer.question.id == +questionId);
  const answerTemplate = (answer: ContributorAnswer) => {
    const contribution = contributions.find(c => c.id == answer.contribution_id);
    const contributor = contribution?.contributor;
    return contributor ? `
      <li>
        <p>${contributor.full_name}</p>
        <p>${contributor.title}</p>
        <p><i>${answer.answer}</i></p>
      </li>
    ` : `
      <li><p style="color:#d11302"><Missing Contribution data</p></li>
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

function initCustomToolbar(customToolbar: Element, numContributions: number) {
  const hasContributions = Boolean(numContributions)
  const successId = 'CHANGEME'
  if (!hasContributions) customToolbar.querySelectorAll<HTMLButtonElement>('.note-btn').forEach(btn => btn.disabled = true);
  customToolbar.insertAdjacentHTML(
    'beforeend', `
      <label>Insert</label>
      <button type="button" class="btn btn-help" title="Inserting Contributions">
        <i class="fa fa-fw fa-question-circle-o"></i>
      </button>
    `
  );
  const helpBtn = customToolbar.querySelector<HTMLButtonElement>('.btn-help');
  if (helpBtn) {
    $(helpBtn).popover({
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
  };
}

function initDropdown(
  type: 'contributions' | 'placeholders', 
  contributions: Contribution[], 
  answers: ContributorAnswer[], 
  context: any
): JQuery<HTMLDivElement, any> {
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
      callback: ($dropdown: JQuery<HTMLUListElement, any>) => {
        $dropdown.find('a').each((i: number, link: HTMLAnchorElement) => {
          link.setAttribute('data-action', 'win-story#pasteContributionOrPlaceholder')
        });
      }
    })
  ]);
  return buttonGroup.render();   // return button as jquery object
}

function dropdownTemplate(
  type: 'contributions' | 'placeholders', 
  contributions: Contribution[], 
  questions: ContributorQuestion[]
) {
  const individualItem = (contribution: Contribution) => {
    const contributor = contribution.contributor;
    if (!contributor) {
      return '<li><p style="color:#d11302"><Missing Contribution data</p></li>'
    }
    const link = `<a href="javascript:;">${contributor.full_name}</a>`;
    const placeholder = type === 'placeholders' && `
      <div class='placeholder' data-contribution-id='${contribution.id}' contenteditable='false'>
        [Individual Contribution: ${contributor.full_name}]
      </div><br>
    `;
    return type === 'contributions' ? 
      `<li data-contribution-id="${contribution.id}">${link}</li>` :
      `<li data-placeholder="${placeholder}">${link}</li>`;
  };
  const groupItem = (question: ContributorQuestion) => {
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
