function cspInitOverlays(e,t,n,o,i){function r(e){"customerstories.net"!==i||o||e.append('<iframe class="cs-iframe" height="0" width="0" style="display:none" src="'+e.attr("href")+'?track=1"></iframe>')}function s(){"object"!=typeof IN?e.ajax({url:"https://platform.linkedin.com/in.js",method:"get",dataType:"script",timeout:5e3}).done(function(){}).fail(function(){}):IN.parse()}function a(t){var n,o=t.find(".story-contributors"),i=o.find(".linkedin-widget"),r=!1,s=null,a=null,c=null,l=i.length,d=0,u=1e4,f=function(e,t){n=setTimeout(function(){window.removeEventListener("message",t,!1),o.remove()},e)},p=function(e,t){t!==e.find('script[type*="MemberProfile"]').data("width")&&(e.remove(),l--)},h=function(e){var t,u,f=e.origin||e.originalEvent.origin,h=f.includes("linkedin")&&e.data.includes("-ready")&&null===s,m=f.includes("linkedin")&&e.data.includes("widgetReady"),v=f.includes("linkedin")&&e.data.includes("resize");s=h&&parseInt(e.data.match(/\w+_(\d+)-ready/)[1],10),(m||v)&&(a=parseInt(e.data.match(/\w+_(\d+)\s/)[1],10),c=a-s,t=i.eq(c)),m&&(r=!0,new ResizeSensor(t,function(){d++,d===l&&(clearTimeout(n),o.css("visibility","visible"))})),v&&(u=JSON.parse(e.data.split(" ")[1]).params[0],p(t,u))};window.addEventListener("message",h,!1),f(u,h),e(document).one("click",".cs-content.content--show .close-button",function(){window.removeEventListener("message",h,!1)})}var c,l=function(){var n,o=0;t.find(".scroll-wrap").on("touchstart",function(e){o=e.originalEvent.touches[0].pageY}).end().find(".scroll-wrap").on("touchmove",function(t){var i;n=e(this).prop("scrollHeight")-e(this).prop("offsetHeight"),i=o-t.originalEvent.touches[0].pageY,(e(this).prop("scrollTop")+i<0||e(this).prop("scrollTop")+i>n)&&(t.preventDefault(),e(this).prop("scrollTop",Math.max(0,Math.min(n,e(this).prop("scrollTop")+i))))})},d=function(t){"pixlee"===n&&t?setTimeout(function(){e("button.olark-launch-button").css({opacity:"1","pointer-events":"auto"})},200):"pixlee"!==n||t||e("button.olark-launch-button").css({opacity:"0","pointer-events":"none"})};e.fn.forceRedraw=function(){return this.hide(0,function(){e(this).show()})},l(),"pixlee"===n&&document.addEventListener("scroll",function(t){if(e(t.target).is("section.content--show .scroll-wrap")){var n=e(t.target).scrollTop();n>c?e(".pixlee-cta").css({position:"fixed",height:"400px",width:e(".story-sidebar").width().toString()+"px",top:"25px",left:(e(".story-sidebar").offset().left+parseInt(e(".story-sidebar").css("padding-left"),10)).toString()+"px"}):e(".pixlee-cta").css({position:"static"})}},!0),t.on("click touchend",".cs-close-xs",function(){e(".content__item--show .cs-close").first().trigger("click"),d(!0)}).on("click",".cs-close",function(){d(!0)}).on("click",".linkedin-widget",function(){window.open(e(this).data("linkedin-url"),"_blank")}).on("click touchend",".primary-cta-xs.open",function(t){e(t.target).is("button.remove")?e(".primary-cta-xs").each(function(){e(this).remove()}):e(t.target).is("a")||e(this).find("a")[0].click()}).on("click touchstart","a.published, a.preview-published",function(o){console.log("click touchstart");var i=e(this),c=t.is("#cs-gallery")?i.index()+1:i.parent().index()+1,l=t.find(".content__item:nth-of-type("+c+")"),u=function(){console.log("storyLoading()"),i.addClass("cs-loading cs-still-loading"),t.find("a.published, a.preview-published").css("pointer-events","none")},f=function(){setTimeout(function(){l.find(".primary-cta-xs").addClass("open")},3e3)};initOverlay=function(){console.log("initOverlay()"),"pixlee"===n&&d(!1),i.hasClass("has-video")&&cspInitVideo(e,l),s()},getStory=function(){e.ajax({url:i.attr("href"),method:"GET",data:{is_plugin:!0,window_width:window.innerWidth},dataType:"jsonp"}).done(function(t){r(i),e.when(l.html(t.html),i.removeClass("cs-still-loading").addClass("cs-loaded")).then(function(){a(l)}).then(function(){initOverlay(),i[0].click(),f()})}).fail(function(){})},openOrGetStory=function(){console.log("openOrGetStory()"),i.hasClass("cs-loaded")?f():(u(),getStory())},o.preventDefault(),"click"===o.type?openOrGetStory():i.hasClass("cs-hover")||(i.addClass("cs-hover"),i.one("touchend",function(e){e.preventDefault()}),i.one("touchstart",openOrGetStory),setTimeout(function(){e("body").one("touchstart",function(t){e(t.target).is(i)||i.has(t.target).length||(i.removeClass("cs-hover"),i.off("touchstart",openOrGetStory))})},100),t.find("a.published, a.preview-published").not(i).each(function(){e(this).removeClass("hover")}))})}!function(){Modernizr=function(e,t,n){function o(e){g.cssText=e}function i(e,t){return typeof e===t}function r(e,t){return!!~(""+e).indexOf(t)}function s(e,t){for(var o in e){var i=e[o];if(!r(i,"-")&&g[i]!==n)return"pfx"!=t||i}return!1}function a(e,t,o){for(var r in e){var s=t[e[r]];if(s!==n)return o===!1?e[r]:i(s,"function")?s.bind(o||t):s}return!1}function c(e,t,n){var o=e.charAt(0).toUpperCase()+e.slice(1),r=(e+" "+b.join(o+" ")+o).split(" ");return i(t,"string")||i(t,"undefined")?s(r,t):(r=(e+" "+x.join(o+" ")+o).split(" "),a(r,t,n))}var l,d,u,f="2.6.2",p={},h=!0,m=t.documentElement,v="modernizr",y=t.createElement(v),g=y.style,w=({}.toString,"Webkit Moz O ms"),b=w.split(" "),x=w.toLowerCase().split(" "),E={},S=[],C=S.slice,T={}.hasOwnProperty;u=i(T,"undefined")||i(T.call,"undefined")?function(e,t){return t in e&&i(e.constructor.prototype[t],"undefined")}:function(e,t){return T.call(e,t)},Function.prototype.bind||(Function.prototype.bind=function(e){var t=this;if("function"!=typeof t)throw new TypeError;var n=C.call(arguments,1),o=function(){if(this instanceof o){var i=function(){};i.prototype=t.prototype;var r=new i,s=t.apply(r,n.concat(C.call(arguments)));return Object(s)===s?s:r}return t.apply(e,n.concat(C.call(arguments)))};return o}),E.csstransitions=function(){return c("transition")};for(var z in E)u(E,z)&&(d=z.toLowerCase(),p[d]=E[z](),S.push((p[d]?"":"no-")+d));return p.addTest=function(e,t){if("object"==typeof e)for(var o in e)u(e,o)&&p.addTest(o,e[o]);else{if(e=e.toLowerCase(),p[e]!==n)return p;t="function"==typeof t?t():t,"undefined"!=typeof h&&h&&(m.className+=" "+(t?"":"no-")+e),p[e]=t}return p},o(""),y=l=null,function(e,t){function n(e,t){var n=e.createElement("p"),o=e.getElementsByTagName("head")[0]||e.documentElement;return n.innerHTML="x<style>"+t+"</style>",o.insertBefore(n.lastChild,o.firstChild)}function o(){var e=y.elements;return"string"==typeof e?e.split(" "):e}function i(e){var t=v[e[h]];return t||(t={},m++,e[h]=m,v[m]=t),t}function r(e,n,o){if(n||(n=t),d)return n.createElement(e);o||(o=i(n));var r;return r=o.cache[e]?o.cache[e].cloneNode():p.test(e)?(o.cache[e]=o.createElem(e)).cloneNode():o.createElem(e),r.canHaveChildren&&!f.test(e)?o.frag.appendChild(r):r}function s(e,n){if(e||(e=t),d)return e.createDocumentFragment();n=n||i(e);for(var r=n.frag.cloneNode(),s=0,a=o(),c=a.length;s<c;s++)r.createElement(a[s]);return r}function a(e,t){t.cache||(t.cache={},t.createElem=e.createElement,t.createFrag=e.createDocumentFragment,t.frag=t.createFrag()),e.createElement=function(n){return y.shivMethods?r(n,e,t):t.createElem(n)},e.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+o().join().replace(/\w+/g,function(e){return t.createElem(e),t.frag.createElement(e),'c("'+e+'")'})+");return n}")(y,t.frag)}function c(e){e||(e=t);var o=i(e);return y.shivCSS&&!l&&!o.hasCSS&&(o.hasCSS=!!n(e,"article,aside,figcaption,figure,footer,header,hgroup,nav,section{display:block}mark{background:#FF0;color:#000}")),d||a(e,o),e}var l,d,u=e.html5||{},f=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,p=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,h="_html5shiv",m=0,v={};!function(){try{var e=t.createElement("a");e.innerHTML="<xyz></xyz>",l="hidden"in e,d=1==e.childNodes.length||function(){t.createElement("a");var e=t.createDocumentFragment();return"undefined"==typeof e.cloneNode||"undefined"==typeof e.createDocumentFragment||"undefined"==typeof e.createElement}()}catch(e){l=!0,d=!0}}();var y={elements:u.elements||"abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video",shivCSS:u.shivCSS!==!1,supportsUnknownElements:d,shivMethods:u.shivMethods!==!1,type:"default",shivDocument:c,createElement:r,createDocumentFragment:s};e.html5=y,c(t)}(this,t),p._version=f,p._domPrefixes=x,p._cssomPrefixes=b,p.testProp=function(e){return s([e])},p.testAllProps=c,p.prefixed=function(e,t,n){return t?c(e,t,n):c(e,"pfx")},m.className=m.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(h?" js "+S.join(" "):""),p}(this,this.document),function(e,t,n){function o(e){return"[object Function]"==v.call(e)}function i(e){return"string"==typeof e}function r(){}function s(e){return!e||"loaded"==e||"complete"==e||"uninitialized"==e}function a(){var e=y.shift();g=1,e?e.t?h(function(){("c"==e.t?f.injectCss:f.injectJs)(e.s,0,e.a,e.x,e.e,1)},0):(e(),a()):g=0}function c(e,n,o,i,r,c,l){function d(t){if(!p&&s(u.readyState)&&(w.r=p=1,!g&&a(),u.onload=u.onreadystatechange=null,t)){"img"!=e&&h(function(){x.removeChild(u)},50);for(var o in z[n])z[n].hasOwnProperty(o)&&z[n][o].onload()}}var l=l||f.errorTimeout,u=t.createElement(e),p=0,v=0,w={t:o,s:n,e:r,a:c,x:l};1===z[n]&&(v=1,z[n]=[]),"object"==e?u.data=n:(u.src=n,u.type=e),u.width=u.height="0",u.onerror=u.onload=u.onreadystatechange=function(){d.call(this,v)},y.splice(i,0,w),"img"!=e&&(v||2===z[n]?(x.insertBefore(u,b?null:m),h(d,l)):z[n].push(u))}function l(e,t,n,o,r){return g=0,t=t||"j",i(e)?c("c"==t?S:E,e,t,this.i++,n,o,r):(y.splice(this.i++,0,e),1==y.length&&a()),this}function d(){var e=f;return e.loader={load:l,i:0},e}var u,f,p=t.documentElement,h=e.setTimeout,m=t.getElementsByTagName("script")[0],v={}.toString,y=[],g=0,w="MozAppearance"in p.style,b=w&&!!t.createRange().compareNode,x=b?p:m.parentNode,p=e.opera&&"[object Opera]"==v.call(e.opera),p=!!t.attachEvent&&!p,E=w?"object":p?"script":"img",S=p?"script":E,C=Array.isArray||function(e){return"[object Array]"==v.call(e)},T=[],z={},k={timeout:function(e,t){return t.length&&(e.timeout=t[0]),e}};f=function(e){function t(e){var t,n,o,e=e.split("!"),i=T.length,r=e.pop(),s=e.length,r={url:r,origUrl:r,prefixes:e};for(n=0;n<s;n++)o=e[n].split("="),(t=k[o.shift()])&&(r=t(r,o));for(n=0;n<i;n++)r=T[n](r);return r}function s(e,i,r,s,a){var c=t(e),l=c.autoCallback;c.url.split(".").pop().split("?").shift(),c.bypass||(i&&(i=o(i)?i:i[e]||i[s]||i[e.split("/").pop().split("?")[0]]),c.instead?c.instead(e,i,r,s,a):(z[c.url]?c.noexec=!0:z[c.url]=1,r.load(c.url,c.forceCSS||!c.forceJS&&"css"==c.url.split(".").pop().split("?").shift()?"c":n,c.noexec,c.attrs,c.timeout),(o(i)||o(l))&&r.load(function(){d(),i&&i(c.origUrl,a,s),l&&l(c.origUrl,a,s),z[c.url]=2})))}function a(e,t){function n(e,n){if(e){if(i(e))n||(u=function(){var e=[].slice.call(arguments);f.apply(this,e),p()}),s(e,u,t,0,l);else if(Object(e)===e)for(c in a=function(){var t,n=0;for(t in e)e.hasOwnProperty(t)&&n++;return n}(),e)e.hasOwnProperty(c)&&(!n&&!--a&&(o(u)?u=function(){var e=[].slice.call(arguments);f.apply(this,e),p()}:u[c]=function(e){return function(){var t=[].slice.call(arguments);e&&e.apply(this,t),p()}}(f[c])),s(e[c],u,t,c,l))}else!n&&p()}var a,c,l=!!e.test,d=e.load||e.both,u=e.callback||r,f=u,p=e.complete||r;n(l?e.yep:e.nope,!!d),d&&n(d)}var c,l,u=this.yepnope.loader;if(i(e))s(e,0,u,0);else if(C(e))for(c=0;c<e.length;c++)l=e[c],i(l)?s(l,0,u,0):C(l)?f(l):Object(l)===l&&a(l,u);else Object(e)===e&&a(e,u)},f.addPrefix=function(e,t){k[e]=t},f.addFilter=function(e){T.push(e)},f.errorTimeout=1e4,null==t.readyState&&t.addEventListener&&(t.readyState="loading",t.addEventListener("DOMContentLoaded",u=function(){t.removeEventListener("DOMContentLoaded",u,0),t.readyState="complete"},0)),e.yepnope=d(),e.yepnope.executeStack=a,e.yepnope.injectJs=function(e,n,o,i,c,l){var d,u,p=t.createElement("script"),i=i||f.errorTimeout;p.src=e;for(u in o)p.setAttribute(u,o[u]);n=l?a:n||r,p.onreadystatechange=p.onload=function(){!d&&s(p.readyState)&&(d=1,n(),p.onload=p.onreadystatechange=null)},h(function(){d||(d=1,n(1))},i),c?p.onload():m.parentNode.insertBefore(p,m)},e.yepnope.injectCss=function(e,n,o,i,s,c){var l,i=t.createElement("link"),n=c?a:n||r;i.href=e,i.rel="stylesheet",i.type="text/css";for(l in o)i.setAttribute(l,o[l]);s||(m.parentNode.insertBefore(i,m),h(n,0))}}(this,document),Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0))}}(),function(e){"use strict";function t(e){return new RegExp("(^|\\s+)"+e+"(\\s+|$)")}function n(e,t){var n=o(e,t)?r:i;n(e,t)}var o,i,r;"classList"in document.documentElement?(o=function(e,t){return e.classList.contains(t)},i=function(e,t){e.classList.add(t)},r=function(e,t){e.classList.remove(t)}):(o=function(e,n){return t(n).test(e.className)},i=function(e,t){o(e,t)||(e.className=e.className+" "+t)},r=function(e,n){e.className=e.className.replace(t(n)," ")});var s={hasClass:o,addClass:i,removeClass:r,toggleClass:n,has:o,add:i,remove:r,toggle:n};"function"==typeof define&&define.amd?define(s):"object"==typeof exports?module.exports=s:e.classie=s}(window),function(e){function t(e){var t,n;return"x"===e?(t=document.body.clientWidth,n=window.innerWidth):"y"===e&&(t=document.body.clientHeight,n=window.innerHeight),t<n?n:t}function n(){return window.pageXOffset||h.scrollLeft}function o(){return window.pageYOffset||h.scrollTop}function i(){r()}function r(){[].slice.call(E).forEach(function(t,n){t.addEventListener("click",function(o){return o.preventDefault(),!(z||C===n||!e(t).hasClass("cs-loaded"))&&(z=!0,C=n,classie.add(t,"grid__item--loading"),void setTimeout(function(){classie.add(t,"grid__item--animate"),setTimeout(function(){s(t)},0)},0))})}),document.addEventListener("keydown",function(e){if(!z&&C!==-1){var t=e.keyCode||e.which;27===t&&(e.preventDefault(),"activeElement"in document&&document.activeElement.blur(),document.activeElement.blur(),document.activeElement.blur(),document.activeElement.blur(),a())}})}function s(n){var i=document.createElement("div");i.className="placeholder",u=e(n).offset().left-L,f=e(n).hasClass("grid__item--carousel")?e(".cs-rh-container").offset().top+parseInt(e(".row-horizon").css("padding-top"))-e(w).offset().top:n.offsetTop,i.style.WebkitTransform="translate3d("+u+"px, "+f+"px, 0px) scale3d("+n.offsetWidth/(b.offsetWidth+L+N+_)+","+n.offsetHeight/t("y")+",1)",i.style.transform="translate3d("+u+"px, "+f+"px, 0px) scale3d("+n.offsetWidth/(b.offsetWidth+L+N+_)+","+n.offsetHeight/t("y")+",1)",classie.add(i,"placeholder--trans-in"),b.appendChild(i),classie.add(p,"view-single"),setTimeout(function(){e(".cs-main").css("z-index","100000"),e("body").css("overflow-x","hidden"),e("#cs-loading-pre-select").css("opacity","0"),i.style.WebkitTransform="translate3d("+-1*L+"px,"+-1*(e(".cs-grid").offset().top-o())+"px, 0px)",i.style.transform="translate3d("+-1*L+"px,"+-1*(e(".cs-grid").offset().top-o())+"px, 0px)",window.addEventListener("scroll",c)},25),g(i,function(){e("#cs-loading-pre-select").remove(),classie.remove(i,"placeholder--trans-in"),classie.add(i,"placeholder--trans-out"),x.style.top=o()-e(".cs-grid").offset().top+"px",classie.add(x,"content--show"),classie.add(S[C],"content__item--show"),classie.addClass(p,"noscroll"),z=!1,e(".content__item--show .cs-close").one("click",a),e(w).find('a.cs-thumbnail:not([style*="display: none"])').each(function(){e(this).removeClass("cs-hover cs-loading cs-still-loading").removeAttr("style")}),e(".cs-overlay-container").removeClass("pre-selected"),e("body").css("overflow-y","hidden"),e("body").css("overflow-x",j),e(".scroll-wrap").css("overflow-y","scroll"),history.replaceState({},null,window.location.pathname+"?story="+n.href.slice(n.href.lastIndexOf("/")+1,n.href.length))})}function a(){e(".scroll-wrap").css("overflow-y","hidden"),e("body").css("overflow-y",k);var n=E[C],o=S[C];classie.remove(o,"content__item--show"),classie.remove(x,"content--show"),classie.remove(p,"view-single"),setTimeout(function(){var i=b.querySelector(".placeholder");classie.removeClass(p,"noscroll"),i.style.WebkitTransform="translate3d("+u+"px, "+f+"px, 0px) scale3d("+n.offsetWidth/(b.offsetWidth+L+N+_)+","+n.offsetHeight/t("y")+",1)",i.style.transform="translate3d("+u+"px, "+f+"px, 0px) scale3d("+n.offsetWidth/(b.offsetWidth+L+N+_)+","+n.offsetHeight/t("y")+",1)",i.style.backgroundColor="rgba(0, 0, 0, 0.6)",g(i,function(){o.parentNode.scrollTop=0,b.removeChild(i),classie.remove(n,"grid__item--loading"),classie.remove(n,"grid__item--animate"),T=!1,window.removeEventListener("scroll",c),e(".cs-main").css("z-index","50"),history.replaceState({},null,window.location.pathname),e(".primary-cta-xs").each(function(){e(this).removeClass("open")})}),C=-1},25)}function c(){T||(T=!0,l=n(),d=o()),window.scrollTo(l,d)}var l,d,u,f,p=document.body,h=window.document.documentElement,m={transitions:Modernizr.csstransitions},v={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd",msTransition:"MSTransitionEnd",transition:"transitionend"},y=v[Modernizr.prefixed("transition")],g=function(e,t){var n=function(e){if(m.transitions){if(e.target!=this)return;this.removeEventListener(y,n)}t&&"function"==typeof t&&t.call(this)};m.transitions?e.addEventListener(y,n):n()},w=document.getElementById("cs-gallery")||document.getElementById("cs-carousel"),b=w.querySelector(".cs-grid"),x=w.querySelector(".cs-content"),E=b.querySelectorAll(".grid__item"),S=x.querySelectorAll(".content__item"),C=-1,T=!1,z=!1,k=e("body").css("overflow-y"),j=e("body").css("overflow-x"),_=window.innerWidth-document.body.clientWidth,L=e(w).offset().left,N=e(window).width()-(e(w).offset().left+e(w).outerWidth());e(".cs-content").css("margin-left","-"+L+"px"),i()}(jQuery),function(e,t){"function"==typeof define&&define.amd?define(t):"object"==typeof exports?module.exports=t():e.ResizeSensor=t()}("undefined"!=typeof window?window:this,function(){function e(e,t){var n=Object.prototype.toString.call(e),o="[object Array]"===n||"[object NodeList]"===n||"[object HTMLCollection]"===n||"[object Object]"===n||"undefined"!=typeof jQuery&&e instanceof jQuery||"undefined"!=typeof Elements&&e instanceof Elements,i=0,r=e.length;if(o)for(;i<r;i++)t(e[i]);else t(e)}function t(e){if(!e.getBoundingClientRect)return{width:e.offsetWidth,height:e.offsetHeight};var t=e.getBoundingClientRect();return{width:Math.round(t.width),height:Math.round(t.height)}}if("undefined"==typeof window)return null;var n=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||function(e){return window.setTimeout(e,20)},o=function(i,r){function s(){var e=[];this.add=function(t){e.push(t)};var t,n;this.call=function(){for(t=0,n=e.length;t<n;t++)e[t].call()},this.remove=function(o){var i=[];for(t=0,n=e.length;t<n;t++)e[t]!==o&&i.push(e[t]);e=i},this.length=function(){return e.length}}function a(e,o){if(e){if(e.resizedAttached)return void e.resizedAttached.add(o);e.resizedAttached=new s,e.resizedAttached.add(o),e.resizeSensor=document.createElement("div"),e.resizeSensor.dir="ltr",e.resizeSensor.className="resize-sensor";var i="position: absolute; left: -10px; top: -10px; right: 0; bottom: 0; overflow: hidden; z-index: -1; visibility: hidden;",r="position: absolute; left: 0; top: 0; transition: 0s;";e.resizeSensor.style.cssText=i,e.resizeSensor.innerHTML='<div class="resize-sensor-expand" style="'+i+'"><div style="'+r+'"></div></div><div class="resize-sensor-shrink" style="'+i+'"><div style="'+r+' width: 200%; height: 200%"></div></div>',e.appendChild(e.resizeSensor);var a=window.getComputedStyle(e).getPropertyValue("position");"absolute"!==a&&"relative"!==a&&"fixed"!==a&&(e.style.position="relative");var c,l,d,u,f=e.resizeSensor.childNodes[0],p=f.childNodes[0],h=e.resizeSensor.childNodes[1],m=t(e),v=m.width,y=m.height,g=function(){var t=0===e.offsetWidth&&0===e.offsetHeight;if(t){var n=e.style.display;e.style.display="block"}p.style.width="100000px",p.style.height="100000px",f.scrollLeft=1e5,f.scrollTop=1e5,h.scrollLeft=1e5,h.scrollTop=1e5,t&&(e.style.display=n)};e.resizeSensor.resetSensor=g;var w=function(){l=0,c&&(v=d,y=u,e.resizedAttached&&e.resizedAttached.call())},b=function(){var o=t(e),i=o.width,r=o.height;c=i!=v||r!=y,c&&!l&&(l=n(w)),g()},x=function(e,t,n){e.attachEvent?e.attachEvent("on"+t,n):e.addEventListener(t,n)};x(f,"scroll",b),x(h,"scroll",b),n(g)}}e(i,function(e){a(e,r)}),this.detach=function(e){o.detach(i,e)},this.reset=function(){i.resizeSensor.resetSensor()}};return o.reset=function(t){e(t,function(e){e.resizeSensor.resetSensor()})},o.detach=function(t,n){e(t,function(e){e&&(e.resizedAttached&&"function"==typeof n&&(e.resizedAttached.remove(n),e.resizedAttached.length())||e.resizeSensor&&(e.contains(e.resizeSensor)&&e.removeChild(e.resizeSensor),delete e.resizeSensor,delete e.resizedAttached))})},o});