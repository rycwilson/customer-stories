import type SummernoteController from './controllers/summernote_controller';
import { type CustomSummernoteOptions, baseConfig, onInit as baseInit } from './summernote';

export function summernoteConfig (
  ctrl: SummernoteController, 
  height: number, 
  curatorPhotoUrl: string,
  curatorPhotoPlaceholderUrl: string
): CustomSummernoteOptions {
  const config: CustomSummernoteOptions = {
    height,
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
    buttons: { placeholdersDropdown: placeholdersDropdown.bind(null, curatorPhotoUrl, curatorPhotoPlaceholderUrl) },
    callbacks: {
      onInit: baseInit(ctrl, () => {
        // custom inititialization
      })
    }
  }
  return { ...baseConfig, ...config };
}

function placeholdersDropdown(
  curatorPhotoUrl: string, 
  curatorPhotoPlaceholderUrl: string, 
  context: any
): JQuery<HTMLDivElement, any> {
  const insertItems: { [key: string]: string } = {
    'Company name': "<span contenteditable='false'>[company_name]</span>",
    'Customer name': "<span contenteditable='false'>[customer_name]</span>",
    'Referrer name': "<span contenteditable='false'>[referrer_full_name]</span>",
    'Contributor first name': "<span contenteditable='false'>[contributor_first_name]</span>",
    'Contributor full name': "<span contenteditable='false'>[contributor_full_name]</span>",
    'CTA button': "<span class='cta-wrapper submit-link'>[contribution_submission_button={text:&quot;Button text goes here&quot;,color:&quot;#4d8664&quot;}]</span>",
    'CTA link': "<span class='submit-link'>[contribution_submission_link=&quot;Link text goes here&quot;]</span>",
    'Curator signature': `
      <p id='curator-signature'>
        <img 
          id='curator-img' 
          src='${curatorPhotoUrl || curatorPhotoPlaceholderUrl}' 
          style='width:80px; margin-bottom:4px;' onerror='this.style.display=&quot;none&quot;'>
        <br>
        <span style='line-height:1.4'>[curator_full_name]</span>
        <br>
        <span style='line-height:1.4'>[curator_title]</span>
        <br>
        <span style='line-height:1.4'>[company_name]</span>
        <br>
        <span style='line-height:1.4'>[curator_phone]</span>
      </p>
    `
  }
  const button = $.summernote.ui.button({
    className: 'btn btn-default dropdown-toggle',
    data: { toggle: 'dropdown', placement: 'top' },
    contents: 'Insert\u00A0\u00A0<span class="caret"></span>',
    // tooltip: 'Insert a data placeholder'
  });
  const dropdown = $.summernote.ui.dropdown({
    className: 'dropdown-menu',
    contents: Object.keys(insertItems).map(linkText => {
      return `
        <li data-placeholder="${insertItems[linkText]}">
          <a href="javascript:;">${linkText}</a>
        </li>
      `;
    }).join(''),
    callback: ($dropdown: JQuery<HTMLUListElement, any>) => {
      $dropdown.find('li').each((i: number, li: HTMLLIElement) => {
        $(li).on('click', function () {
          context.invoke('editor.saveRange');
          context.invoke('editor.pasteHTML', $(li).data('placeholder'));
          context.invoke('editor.restoreRange');
        });
      });
    }
  });
  return $.summernote.ui.buttonGroup([button, dropdown]).render();
}