// import { initView } from './views';

export function onLoad(e: CustomEvent) {
  console.log('turbo:load')
  // initView(document.body.dataset.controller, document.body.dataset.action);
}

export function onClick(e: CustomEvent) {
  console.log('turbo:click')
}

export function onBeforeRender(e: CustomEvent) {
  console.log('turbo:before-render')
  // e.preventDefault()   // pause render
  // e.detail.resume()   // resume render

  // custom render
  // e.detail.render = (currentEl, newEl) => {
    // return custom element
  // }
}

export function onRender(e: CustomEvent) {
  console.log('turbo:render')
}

export function onBeforeVisit(e: CustomEvent) {
  console.log('turbo:before-visit')
}

export function onVisit(e: CustomEvent) {
  console.log('turbo:visit')
}

export function onBeforeFetchRequest(e: CustomEvent) {
  console.log('turbo:before-fetch-request');
  // e.preventDefault()
  // e.detail.resume()
}

export function onBeforeFetchResponse(e: CustomEvent) {
  console.log('turbo:before-fetch-response');
}

export function onBeforeCache(e: CustomEvent) {
  console.log('turbo:before-cache')
}