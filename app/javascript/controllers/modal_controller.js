import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['title', 'body', 'turboFrame', 'form', 'footer', 'dismissBtn', 'submitBtn'];
  static values = { 
    title: { type: String, default: 'title is missing' },
    turboFrameAttrs: { type: Object, default: {} },
    bodyContent: { type: String, default: '' },
  };

  static hiddenHandler;
  static ajaxSuccessHandler;
  formId;
  
  initialize() {
    this.hiddenHandler = this.onHidden.bind(this);
    this.ajaxSuccessHandler = this.onAjaxSuccess.bind(this);
  }

  connect() {
    $(this.element).on('hidden.bs.modal', this.hiddenHandler);
  }

  disconnect() {
    $(this.element).off('hidden.bs.modal', this.hiddenHandler);
  }

  titleValueChanged(newTitle) {
    this.titleTarget.textContent = newTitle;
  }

  bodyContentValueChanged(newContent, oldContent) {
    [...this.bodyTarget.children].forEach(child => { if (!child.isSameNode(this.turboFrameTarget)) child.remove(); });
    if (newContent) {
      this.turboFrameTarget.classList.add('hidden');
      this.bodyTarget.insertAdjacentHTML('beforeend', newContent);
    } else {
      this.turboFrameTarget.classList.remove('hidden');
    }
  }

  turboFrameAttrsValueChanged(attrs) {
    if (attrs.id && attrs.src) {
      if (attrs.id.match(/^(new|edit)/)) this.actionValue = attrs.id.match(/^(?<action>new|edit)/).groups.action;
      this.turboFrameTarget.insertAdjacentHTML('afterbegin', this.turboFrameTarget.dataset.placeholder);
      this.turboFrameTarget.id = attrs.id;
      this.turboFrameTarget.src = attrs.src;
    } else {
      this.turboFrameTarget.replaceChildren();
    }
  }

  onFrameRender(e) {
    console.log('turbo:before-frame-render', e.detail.newFrame);
    if (this.hasFormTarget) {
      this.dismissBtnTarget.textContent = 'Cancel';
      this.submitBtnTarget.value = this.formTarget.dataset.submitBtnText;
      this.footerTarget.classList.remove('hidden');
      this.submitBtnTarget.setAttribute('form', this.formTarget.id);
      $(this.formTarget).on('ajax:success', this.ajaxSuccessHandler);
    } else {
      this.dismissBtnTarget.textContent = 'Close';
    }
  }
  
  onAjaxSuccess(e, data, status, xhr) {
    if (data.status === 'ok') {
      this.hide();
    } else {
      // handle errors
    }
  }
  
  show() {
    $(this.element).modal('show');
  }

  hide() {
    $(this.element).modal('hide');
  }

  changeSubmitBtnText({ detail: { submitBtnText } }) {
    this.submitBtnTarget.value = submitBtnText;
  }

  onHidden() {
    if (this.hasFormTarget) $(this.formTarget).off('ajax:success', this.ajaxSuccessHandler);
    this.turboFrameAttrsValue = {};
    this.bodyContentValue = '';
    this.dismissBtnTarget.textContent = '';
    this.submitBtnTarget.value = '';
    this.footerTarget.classList.add('hidden');
  }
}