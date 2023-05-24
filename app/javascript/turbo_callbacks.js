export function onLoad(e) {
  console.log('turbo:load', e)
}

export function onBeforeRender(e) {
  console.log('turbo:before-render')
}

export function onRender(e) {
  console.log('turbo:render')
}

export function onBeforeVisit(e) {
  console.log('turbo:before-visit')
}

export function onVisit(e) {
  console.log('turbo:visit')
}

export function onBeforeFetchRequest(e) {
  console.log('turbo:before-fetch-request');
}

export function onBeforeFetchResponse(e) {
  console.log('turbo:before-fetch-response');
}

export function onBeforeCache(e) {
  console.log('turbo:before-cache')
}