import type { 
  TurboLoadEvent,
  TurboClickEvent,
  TurboBeforeVisitEvent, 
  TurboVisitEvent,
  TurboBeforeRenderEvent, 
  TurboRenderEvent,
  TurboFrameLoadEvent,
  TurboBeforeFrameRenderEvent, 
  TurboFrameRenderEvent,
  TurboSubmitStartEvent,
  TurboSubmitEndEvent } from '@hotwired/turbo';

export function onLoad(e: TurboLoadEvent) {
  console.log('turbo:load', e)
  // initView(document.body.dataset.controller, document.body.dataset.action);
}

export function onClick(e: TurboClickEvent) {
  console.log('turbo:click', e)
}

export function onBeforeVisit(e: TurboBeforeVisitEvent) {
  console.log('turbo:before-visit', e)
}

export function onVisit(e: TurboVisitEvent) {
  console.log('turbo:visit', e)
}

export function onSubmitStart(e: TurboSubmitStartEvent) {
  console.log('turbo:submit-start', e)
}

export function onSubmitEnd(e: TurboSubmitEndEvent) {
  console.log('turbo:submit-end', e)
}

export function onBeforeRender(e: TurboBeforeRenderEvent) {
  console.log('turbo:before-render', e)
  // e.preventDefault()   // pause render
  // e.detail.resume()   // resume render

  // custom render
  // e.detail.render = (currentEl, newEl) => {
    // return custom element
  // }
}

export function onRender(e: TurboRenderEvent) {
  console.log('turbo:render', e)
}

export function onFrameLoad(e: TurboFrameLoadEvent) {
  console.log('turbo:frame-load', e)
}

export function onBeforeFrameRender(e: TurboBeforeFrameRenderEvent) {
  console.log('turbo:before-frame-render', e)
}

export function onFrameRender(e: TurboFrameRenderEvent) {
  console.log('turbo:frame-render', e)
}

// no custom event type for this
export function onBeforeFetchRequest(e: CustomEvent) {
  console.log('turbo:before-fetch-request', e);
}

// no custom event type for this
export function onBeforeFetchResponse(e: CustomEvent) {
  console.log('turbo:before-fetch-response', e);
}

// no custom event type for this
export function onBeforeCache(e: CustomEvent) {
  console.log('turbo:before-cache', e)
}