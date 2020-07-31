
import conTable from '../contributors/con_table';
import _uniqBy from 'lodash/uniqBy';
import _escape from 'lodash/escape';

export function dropdownMenuTemplate(type, contributionsQandA) {
  const answers = _uniqBy(contributionsQandA.answers, (answer) => answer.contribution_id);
  return `
    <ul class="list-unstyled" style="margin-bottom: 0">
      <li class="dropdown-section">
        <span>Individual Contributions</span>&nbsp;
        <span>${ type === 'placeholders' ? '(placeholders)' : '' }</span>  
      </li>
      ${
        answers.map((answer) => {
          let contributor = conTable.get(answer.contribution_id);
          let placeholderHtml = individualContributionPlaceholder(answer.contribution_id, contributor);
          return type === 'contributions' ? `
              <li data-contribution-id="${ answer.contribution_id }">
                <a>${ contributor.full_name }</a>
              </li>
            ` : `  
              <li data-placeholder="${ placeholderHtml }">
                <a>${ contributor.full_name }</a> 
              </li>
            `
        }).join('')
      }
      <li class="dropdown-section">
        <span>Group Contributions</span>&nbsp;
        <span>${ type === 'placeholders' ? '(placeholders)' : '' }</span>
      </li>
      ${
        contributionsQandA.questions.map((question) => {
          let placeholderHtml = groupContributionPlaceholder(question);
          return type === 'contributions' ? `
              <li data-question-id="${ question.id }">
                <a>${ question.question }</a>
              </li>
            ` : `  
              <li data-placeholder="${ placeholderHtml }">
                <a>${ question.question }</a>
              </li>
            `
        }).join('')
      }
    </ul>
  `
} 

export function individualContributionTemplate (contributionId, contributionsQandA, $placeholder) {
  const placeholder = $placeholder ? 
    _escape($placeholder.wrap('<p/>').parent().html()) : 
    null;
  const contributor = conTable.get(contributionId);
  const contributionQandA = contributionsQandA.answers.filter((a) => {
    return a.contribution_id == contributionId;
  })
    .map((a) => ({
      question: contributionsQandA
                  .questions.find((q) => q.id === a.contributor_question_id)
                  .question,
      answer: a.answer
    }));
  return `
    <div class="individual-contribution" data-contribution-id="${ contributionId }" 
         ${ placeholder ? ` data-placeholder="${ placeholder }"` : '' }>
      <p>${ contributor.full_name }</p>
      <p>${ contributor.title }</p>
      <ul>
        ${ 
          contributionQandA.map((pair) => `
            <li>
              <p>${ pair.question }</p>
              <p><i>${ pair.answer }</i></p>
            </li>
          `).join('')
        }
      </ul>
    </div></br>
  `;
}

export function groupContributionTemplate(questionId, contributionsQandA, $placeholder) {
  const placeholder = $placeholder ? 
    _escape($placeholder.wrap('<p/>').parent().html()) : 
    null;
  const question = contributionsQandA.questions.filter((q) => q.id == questionId)[0];
  const answers = contributionsQandA.answers.filter((a) => {
    return a.contributor_question_id == questionId;
  })
    .map((a) => ({
      answer: a.answer,
      contributor: conTable.get(a.contribution_id)
    }));
  return `
    <div class="group-contribution" data-question-id="${ questionId }" 
         ${ placeholder ? ` data-placeholder="${ placeholder }"` : '' }>
      <p>${ question.question }</p>
      <ul>
        ${ 
          answers.map((answer) => `
            <li>
              <p>${ answer.contributor.full_name }</p>
              <p><i>${ answer.answer }</i></p>
            </li>
          `).join('')
        }
      </ul>
    </div></br>
  `;
}

function individualContributionPlaceholder(contributionId, contributor) {
  return `
    <div class='placeholder' data-contribution-id='${ contributionId }' contenteditable='false'>
      [ Individual Contribution: ${ contributor.full_name } ]
    </div></br>
  `
}

function groupContributionPlaceholder(question) {
  return `
    <div class='placeholder' data-question-id='${ question.id }' contenteditable='false'>
      [ Group Contribution: ${ question.question } ]
    </div></br>
  `
}
