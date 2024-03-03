import { Controller } from '@hotwired/stimulus';
import { initS3Upload } from '../user_uploads';
import type { FrameElement } from '@hotwired/turbo'

export default class ModalController extends Controller<HTMLDivElement> {
  static targets = ['title', 'body', 'turboFrame', 'form', 'footer', 'dismissBtn', 'submitBtn'];
  declare readonly titleTarget: HTMLHeadingElement;
  declare readonly bodyTarget: HTMLDivElement;
  declare readonly turboFrameTarget: FrameElement;
  declare readonly hasTurboFrameTarget: boolean;
  declare readonly formTarget: HTMLFormElement;
  declare readonly hasFormTarget: boolean;
  declare readonly footerTarget: HTMLDivElement;
  declare readonly dismissBtnTarget: HTMLButtonElement;
  declare readonly submitBtnTarget: HTMLInputElement;

  static values = { 
    title: { type: String, default: 'title is missing' },
    turboFrameAttrs: { type: Object, default: {} },
    bodyContent: { type: String, default: '' },
  };
  declare titleValue: string;
  declare bodyContentValue: string;
  declare turboFrameAttrsValue: TurboFrameAttributes | {};

  declare spinnerTimer: number;

  ajaxSuccessHandler: (this: ModalController, e: Event) => void = this.onAjaxSuccess.bind(this);
  hiddenHandler: (this: ModalController, e: any) => void = this.onHidden.bind(this);

  connect() {
    $(this.element).on('hidden.bs.modal', this.hiddenHandler);
  }

  disconnect() {
    $(this.element).off('hidden.bs.modal', this.hiddenHandler);
  }

  titleValueChanged(newTitle: string) {
    this.titleTarget.textContent = newTitle;
  }

  bodyContentValueChanged(newContent: string) {
    Array.from(this.bodyTarget.children).forEach(child => { if (!child.isSameNode(this.turboFrameTarget)) child.remove(); });
    if (newContent) {
      this.turboFrameTarget.classList.add('hidden');
      this.bodyTarget.insertAdjacentHTML('beforeend', newContent);
    } else {
      this.turboFrameTarget.classList.remove('hidden');
    }
  }

  turboFrameAttrsValueChanged(attrs: TurboFrameAttributes | {}) {
    const { id, src } = attrs as TurboFrameAttributes;
    if (id && src) {
      // if (/^(new|edit)/.test(id)) this.actionValue = id.match(/^(?<action>new|edit)/).groups.action;
      if (this.turboFrameTarget.dataset.spinnerHtml) {
        this.turboFrameTarget.insertAdjacentHTML('afterbegin', this.turboFrameTarget.dataset.spinnerHtml);
        this.spinnerTimer = window.setTimeout(() => {
          const spinner = <HTMLDivElement>this.turboFrameTarget.querySelector(':scope > .spinner');
          spinner.classList.add('spinner--opaque');
        }, 750)
      }
      this.turboFrameTarget.id = id;
      this.turboFrameTarget.src = src;
    } else {
      this.turboFrameTarget.replaceChildren();
    }
  }

  onFrameRender(e: CustomEvent) {
    // console.log('turbo:before-frame-render', e.detail.newFrame);
    window.clearTimeout(this.spinnerTimer);
    this.setFooterContent();
    if (this.hasFormTarget) {
      this.formTarget.addEventListener('ajax:success', this.ajaxSuccessHandler);
      if (this.turboFrameTarget.id.includes('edit-customer')) {
        initS3Upload($(this.formTarget));
      }
    } 
  }

  setFooterContent() {
    if (this.hasFormTarget) {
      this.dismissBtnTarget.textContent = 'Cancel';
      this.submitBtnTarget.value = this.formTarget.dataset.submitBtnText || 'Submit';
      this.footerTarget.classList.remove('hidden');
      this.submitBtnTarget.setAttribute('form', this.formTarget.id);
      this.formTarget.addEventListener('ajax:success', this.ajaxSuccessHandler);
    } else {
      this.dismissBtnTarget.textContent = 'Close';
    }
  }
  
  onAjaxSuccess(this: ModalController, e: Event) {
    if (e instanceof CustomEvent) {
      const [data, status, xhr] = e.detail;
    }
    // if (ok) {
    //   this.hide();
    // } else {
    //   // handle errors
    // }
  }
  
  show() {
    $(this.element).modal('show');
  }

  hide() {
    $(this.element).modal('hide');
  }

  setSubmitBtnText({ detail: btnText }: { detail: string }) {
    this.submitBtnTarget.value = btnText;
  }

  onHidden(this: ModalController, e: any) {
    if (this.hasFormTarget) this.formTarget.removeEventListener('ajax:success', this.ajaxSuccessHandler);
    this.turboFrameAttrsValue = {};
    this.bodyContentValue = '';
    this.dismissBtnTarget.textContent = '';
    this.submitBtnTarget.value = '';
    this.footerTarget.classList.add('hidden');
  }
}