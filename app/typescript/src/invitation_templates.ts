import SummernoteController from './controllers/summernote_controller';
import type { CustomSummernoteOptions } from './summernote';

export function summernoteConfig (
  ctrl: SummernoteController, 
  height: number, 
  curatorPhotoPlaceholderPath: string
): CustomSummernoteOptions {
  return {
    // height,
    toolbar: [
      // ['style', ['style']],
      ['font', ['bold', 'italic', 'underline']], //, 'clear']],
      // ['fontname', ['fontname']],
      // ['fontsize', ['fontsize']],
      // ['color', ['color']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['height', ['height']],
      // ['table', ['table']],
      ['insert', ['link', 'picture', 'hr']],
      ['view', ['codeview']],
      // ['help', ['help']]
      ['customButton', ['placeholdersDropdown']]
    ] as Summernote.toolbarDef,
    buttons: { placeholdersDropdown: placeholdersDropdown.bind(null, curatorPhotoPlaceholderPath) },
    callbacks: {
      onInit() {}
    }
  }
}

function placeholdersDropdown(curatorPhotoPlaceholderPath: string, context: any): JQuery<HTMLDivElement, any> {
  const ui = $.summernote.ui;
  const curatorSignaturePlaceholderHtml = `
    <p id=&quot;curator-signature&quot;>
      <img id=&quot;curator-img&quot; src=&quot;${curatorPhotoPlaceholderPath}&quot; style=&quot;width:80px; margin-bottom:4px;&quot; onerror=&quot;this.style.display=\'none\'>&quot;><br>
      <span style=&quot;line-height:1.4&quot;>[curator_full_name]</span><br>
      <span style=&quot;line-height:1.4&quot;>[curator_title]</span><br>
      <span style=&quot;line-height:1.4&quot;>[company_name]</span><br>
      <span style=&quot;line-height:1.4&quot;>[curator_phone]</span>
    </p>
  `;
  const button = ui.buttonGroup([
    ui.button({
      className: 'btn btn-default dropdown-toggle',
      data: {
        toggle: 'dropdown',
        placement: 'top'
      },
      contents: 'Insert\xa0\xa0<span class="caret"></span>',
      // tooltip: 'Insert a data placeholder'
    }),
    ui.dropdown({
      className: 'summernote-custom',
      contents: `
        <li data-placeholder="<span contenteditable=&quot;false&quot;>[company_name]</span>">
          <a href="javascript:;">Company name</a>
        </li>
        <li data-placeholder="<span contenteditable=&quot;false&quot;>[customer_name]</span>">
          <a href="javascript:;">Customer name</a>
        </li>
        <li data-placeholder="<span contenteditable=&quot;false&quot;>[referrer_full_name]</span>">
          <a href="javascript:;">Referrer name</a>
        </li>
        <li data-placeholder="<span contenteditable=&quot;false&quot;>[contributor_first_name]</span>">
          <a href="javascript:;">Contributor first name</a>
        </li>
        <li data-placeholder="<span contenteditable=&quot;false&quot;>[contributor_full_name]</span>">
          <a href="javascript:;">Contributor full name</a>
        </li>
        <li data-placeholder="<span class=&quot;cta-wrapper submit-link&quot;>[contribution_submission_button={text:&quot;Button text goes here&quot;,color:&quot;#4d8664&quot;}]</span>">
          <a href="javascript:;">Contribution submission button</a>
        </li>
        <li data-placeholder="<span class=&quot;submit-link&quot;>[contribution_submission_link=&quot;Link text goes here&quot;]</span>">
          <a href="javascript:;">Contribution submission link</a>
        </li>
        <li data-placeholder="<span class=&quot;submit-link&quot;>[feedback_submission_link=&quot;Link text goes here&quot;]</span>">
          <a href="javascript:;">Feedback submission link</a>
        </li>
        <li data-placeholder="${curatorSignaturePlaceholderHtml}">
          <a href="javascript:;">Curator signature</a>
        </li>
      `,  
      callback: ($dropdown: JQuery<HTMLUListElement, any>) => {
        $dropdown.find('li').each((i: number, li: HTMLLIElement) => {
          $(li).on('click', function () {
            context.invoke('editor.saveRange');
            context.invoke('editor.pasteHTML', $(li).data('placeholder'));
            context.invoke('editor.restoreRange');
          });
        });
      }
    })
  ]);
  return button.render();   // return button as jquery object
}