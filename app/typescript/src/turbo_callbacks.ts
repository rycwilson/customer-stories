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
  TurboSubmitEndEvent,
  TurboBeforeCacheEvent } from '@hotwired/turbo';

export function onLoad(e: TurboLoadEvent) {
  // console.log(...logCommon(e), e)
  // const scrollPosition = sessionStorage.getItem("scrollPosition");
  // if (scrollPosition) {
  //   scrollTo(0, parseInt(scrollPosition, 10));
  //   sessionStorage.removeItem("scrollPosition");
  // }
}

export function onClick(e: TurboClickEvent) {
  // console.log('turbo:click', e)
}

export function beforeVisit(e: TurboBeforeVisitEvent) {
  // console.log('turbo:before-visit\n', `${location.pathname}\n`, e)
}

export function onVisit(e: TurboVisitEvent) {
  // console.log(...logCommon(e), `${e.detail.action} ${e.detail.url}\n`, e)
}

export function onSubmitStart(e: TurboSubmitStartEvent) {
  // console.log('turbo:submit-start', e)
  sessionStorage.setItem("scrollPosition", window.scrollY.toString());
}

export function onSubmitEnd(e: TurboSubmitEndEvent) {
  // console.log('turbo:submit-end', e)
}

export function beforeRender(e: TurboBeforeRenderEvent) {
  // console.log('turbo:before-render\n', `${location.pathname}\n`, e)
  // e.preventDefault()   // pause render
  // e.detail.resume()   // resume render

  // custom render
  // e.detail.render = (currentEl, newEl) => {
    // return custom element
  // }
}

export function onRender(e: TurboRenderEvent) {
  // console.log(...logCommon(e), e);
}

export function onFrameLoad(e: TurboFrameLoadEvent) {
  // console.log(...logCommon(e), e);
}

export function beforeFrameRender(e: TurboBeforeFrameRenderEvent) {
  // logCommon(e)
  // console.log(e)
}

export function onFrameRender(e: TurboFrameRenderEvent) {
  // console.log(...logCommon(e), e);
}

// no custom event type for this
export function beforeFetchRequest(e: CustomEvent) {
  // console.log( 
  //   ...logCommon(e),
  //   `${e.detail.fetchOptions.method} ${e.detail.url.href}\n`,
  //   `referrer: ${e.detail.fetchOptions.referrer}\n`,
  //   e
  // );
}

// no custom event type for this
export function beforeFetchResponse(e: CustomEvent) {
  // const { response } = e.detail.fetchResponse;
  // console.log(
  //   ...logCommon(e),
  //   `${response.status} ${response.statusText} ${response.url}\n`,
  //   e
  // )
}

// no custom event type for this
export function beforeCache(e: TurboBeforeCacheEvent) {
  console.log(...logCommon(e), e)
}

function logCommon(e: CustomEvent) {
  const body = (e.target as HTMLHtmlElement).querySelector(':scope > body') as HTMLBodyElement;
  let target;
  if (body) {
    target = body.classList.contains('show') ? 
      'dashboard' : 
      (body.classList.contains('edit') ? 'settings' : 'profile');
  }
  return [
    `${location.pathname}\n`,
    `${e.type}\n`, 
    `target: ${target || 'unknown'}\n`
  ];
}