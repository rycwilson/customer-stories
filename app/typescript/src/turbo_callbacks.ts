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

export function onLoad(_e: TurboLoadEvent) {
  // console.log(...logCommon(e), e)
  // const scrollPosition = sessionStorage.getItem("scrollPosition");
  // if (scrollPosition) {
  //   scrollTo(0, parseInt(scrollPosition, 10));
  //   sessionStorage.removeItem("scrollPosition");
  // }
}

export function onClick(_e: TurboClickEvent) {
  // console.log('turbo:click', e)
}

export function beforeVisit(_e: TurboBeforeVisitEvent) {
}

export function onVisit(_e: TurboVisitEvent) {
  // console.log(...logCommon(e), `${e.detail.action} ${e.detail.url}\n`, e)
}

export function onSubmitStart(_e: TurboSubmitStartEvent) {
  // console.log('turbo:submit-start', e)
  sessionStorage.setItem("scrollPosition", window.scrollY.toString());
}

export function onSubmitEnd(_e: TurboSubmitEndEvent) {
}

export function beforeRender(_e: TurboBeforeRenderEvent) {
  // console.log('turbo:before-render', e)
  // e.preventDefault()   // pause render
  // e.detail.resume()   // resume render

  // custom render
  // e.detail.render = (currentEl, newEl) => {
    // return custom element
  // }
}

export function onRender(_e: TurboRenderEvent) {
  // console.log(...logCommon(e), e);
}

export function onFrameLoad(_e: TurboFrameLoadEvent) {
  // console.log(...logCommon(e), e);
}

export function beforeFrameRender(_e: TurboBeforeFrameRenderEvent) {
  // logCommon(e)
  // console.log(e)
}

export function onFrameRender(_e: TurboFrameRenderEvent) {
  // console.log(...logCommon(e), e);
}

// no custom event type for this
export function beforeFetchRequest(_e: CustomEvent) {
  // console.log( 
  //   ...logCommon(e),
  //   `${e.detail.fetchOptions.method} ${e.detail.url.pathname}\n`,
  //   e
  // );
}

// no custom event type for this
export function beforeFetchResponse(e: CustomEvent) {
  const { response } = e.detail.fetchResponse;
  // console.log(
  //   ...logCommon(e),
  //   `${response.status} ${response.statusText}\n`,
  //   e
  // )
}

// no custom event type for this
export function beforeCache(_e: TurboBeforeCacheEvent) {
  // console.log(...logCommon(e), e)
}

function logCommon(e: CustomEvent) {
  const { target } = e;
  return [
    `location: ${location.pathname}\n`,
    `typ_e: ${e.type}\n`, 
    `target: ${target}\n`
  ];
}