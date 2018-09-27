function cspInitOverlays(e,t,n,o){function i(e){}function r(){"object"!=typeof IN?e.ajax({url:"https://platform.linkedin.com/in.js",method:"get",dataType:"script",timeout:5e3}).done(function(){}).fail(function(){}):IN.parse()}function s(t){var n,o=t.find(".story-contributors"),i=o.find(".linkedin-widget"),r=!1,s=null,a=null,c=null,l=0,d=1e4,f=function(e,t){n=setTimeout(function(){window.removeEventListener("message",t,!1),o.remove()},e)},u=function(t){var n=t.find("iframe");n.one("load",function(){var t=e(this);setTimeout(function(){t.width()!==t.closest(".linkedin-widget").find('script[type*="MemberProfile"]').data("width")&&t.parent().remove()},3e3)})},p=function(e){var t;e.origin||e.originalEvent.origin;e.origin.includes("linkedin")&&e.data.includes("-ready")&&null===s?s=parseInt(e.data.match(/\w+_(\d+)-ready/)[1],10):e.origin.includes("linkedin")&&e.data.includes("widgetReady")&&(r||(r=!0),l++,a=parseInt(e.data.match(/\w+_(\d+)\s/)[1],10),c=a-s,t=i.eq(c),u(t),l===i.length&&1!==i.length?(clearTimeout(n),o.css("visibility","visible")):1===i.length&&o.remove())};f(d,p),window.addEventListener("message",p,!1),e(document).one("click",".cs-content.content--show .close-button",function(){window.removeEventListener("message",p,!1)})}var a=function(e){e.addClass("cs-loading"),t.find("a").css("pointer-events","none"),setTimeout(function(){e.hasClass("cs-loaded")||e.addClass("cs-still-loading")},1e3)},c=function(){var n,o=0;t.find(".scroll-wrap").on("touchstart",function(e){o=e.originalEvent.touches[0].pageY}).end().find(".scroll-wrap").on("touchmove",function(t){var i;n=e(this).prop("scrollHeight")-e(this).prop("offsetHeight"),i=o-t.originalEvent.touches[0].pageY,(e(this).prop("scrollTop")+i<0||e(this).prop("scrollTop")+i>n)&&(t.preventDefault(),e(this).prop("scrollTop",Math.max(0,Math.min(n,e(this).prop("scrollTop")+i))))})};c(),t.on("click","a.published, a.preview-published",function(n){n.preventDefault();var o,c=e(this);return!c.hasClass("cs-loaded")&&(a(c),void e.ajax({url:c.attr("href"),method:"GET",data:{is_widget:!0,window_width:window.innerWidth},dataType:"jsonp"}).done(function(n){var a=t.is("#cs-gallery")?c.index()+1:c.parent().index()+1;o=t.find(".content__item:nth-of-type("+a+")"),i(c),e.when(o.html(n.html),c.removeClass("cs-still-loading").addClass("cs-loaded")).then(function(){s(o)}).then(function(){c.hasClass("has-video")&&cspInitVideo(e,o),r(),t.on("click touchend",".cs-close-xs",function(){e(".content__item--show .cs-close").first().trigger("click")}),t.on("click",".linkedin-widget",function(){window.open(e(this).data("linkedin-url"),"_blank")}),c[0].click()})}).fail(function(){}))})}!function(){Modernizr=function(e,t,n){function o(e){y.cssText=e}function i(e,t){return typeof e===t}function r(e,t){return!!~(""+e).indexOf(t)}function s(e,t){for(var o in e){var i=e[o];if(!r(i,"-")&&y[i]!==n)return"pfx"!=t||i}return!1}function a(e,t,o){for(var r in e){var s=t[e[r]];if(s!==n)return o===!1?e[r]:i(s,"function")?s.bind(o||t):s}return!1}function c(e,t,n){var o=e.charAt(0).toUpperCase()+e.slice(1),r=(e+" "+b.join(o+" ")+o).split(" ");return i(t,"string")||i(t,"undefined")?s(r,t):(r=(e+" "+E.join(o+" ")+o).split(" "),a(r,t,n))}var l,d,f,u="2.6.2",p={},m=!0,h=t.documentElement,v="modernizr",g=t.createElement(v),y=g.style,w=({}.toString,"Webkit Moz O ms"),b=w.split(" "),E=w.toLowerCase().split(" "),x={},T=[],C=T.slice,k={}.hasOwnProperty;f=i(k,"undefined")||i(k.call,"undefined")?function(e,t){return t in e&&i(e.constructor.prototype[t],"undefined")}:function(e,t){return k.call(e,t)},Function.prototype.bind||(Function.prototype.bind=function(e){var t=this;if("function"!=typeof t)throw new TypeError;var n=C.call(arguments,1),o=function(){if(this instanceof o){var i=function(){};i.prototype=t.prototype;var r=new i,s=t.apply(r,n.concat(C.call(arguments)));return Object(s)===s?s:r}return t.apply(e,n.concat(C.call(arguments)))};return o}),x.csstransitions=function(){return c("transition")};for(var _ in x)f(x,_)&&(d=_.toLowerCase(),p[d]=x[_](),T.push((p[d]?"":"no-")+d));return p.addTest=function(e,t){if("object"==typeof e)for(var o in e)f(e,o)&&p.addTest(o,e[o]);else{if(e=e.toLowerCase(),p[e]!==n)return p;t="function"==typeof t?t():t,"undefined"!=typeof m&&m&&(h.className+=" "+(t?"":"no-")+e),p[e]=t}return p},o(""),g=l=null,function(e,t){function n(e,t){var n=e.createElement("p"),o=e.getElementsByTagName("head")[0]||e.documentElement;return n.innerHTML="x<style>"+t+"</style>",o.insertBefore(n.lastChild,o.firstChild)}function o(){var e=g.elements;return"string"==typeof e?e.split(" "):e}function i(e){var t=v[e[m]];return t||(t={},h++,e[m]=h,v[h]=t),t}function r(e,n,o){if(n||(n=t),d)return n.createElement(e);o||(o=i(n));var r;return r=o.cache[e]?o.cache[e].cloneNode():p.test(e)?(o.cache[e]=o.createElem(e)).cloneNode():o.createElem(e),r.canHaveChildren&&!u.test(e)?o.frag.appendChild(r):r}function s(e,n){if(e||(e=t),d)return e.createDocumentFragment();n=n||i(e);for(var r=n.frag.cloneNode(),s=0,a=o(),c=a.length;s<c;s++)r.createElement(a[s]);return r}function a(e,t){t.cache||(t.cache={},t.createElem=e.createElement,t.createFrag=e.createDocumentFragment,t.frag=t.createFrag()),e.createElement=function(n){return g.shivMethods?r(n,e,t):t.createElem(n)},e.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+o().join().replace(/\w+/g,function(e){return t.createElem(e),t.frag.createElement(e),'c("'+e+'")'})+");return n}")(g,t.frag)}function c(e){e||(e=t);var o=i(e);return g.shivCSS&&!l&&!o.hasCSS&&(o.hasCSS=!!n(e,"article,aside,figcaption,figure,footer,header,hgroup,nav,section{display:block}mark{background:#FF0;color:#000}")),d||a(e,o),e}var l,d,f=e.html5||{},u=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,p=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,m="_html5shiv",h=0,v={};!function(){try{var e=t.createElement("a");e.innerHTML="<xyz></xyz>",l="hidden"in e,d=1==e.childNodes.length||function(){t.createElement("a");var e=t.createDocumentFragment();return"undefined"==typeof e.cloneNode||"undefined"==typeof e.createDocumentFragment||"undefined"==typeof e.createElement}()}catch(e){l=!0,d=!0}}();var g={elements:f.elements||"abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video",shivCSS:f.shivCSS!==!1,supportsUnknownElements:d,shivMethods:f.shivMethods!==!1,type:"default",shivDocument:c,createElement:r,createDocumentFragment:s};e.html5=g,c(t)}(this,t),p._version=u,p._domPrefixes=E,p._cssomPrefixes=b,p.testProp=function(e){return s([e])},p.testAllProps=c,p.prefixed=function(e,t,n){return t?c(e,t,n):c(e,"pfx")},h.className=h.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(m?" js "+T.join(" "):""),p}(this,this.document),function(e,t,n){function o(e){return"[object Function]"==v.call(e)}function i(e){return"string"==typeof e}function r(){}function s(e){return!e||"loaded"==e||"complete"==e||"uninitialized"==e}function a(){var e=g.shift();y=1,e?e.t?m(function(){("c"==e.t?u.injectCss:u.injectJs)(e.s,0,e.a,e.x,e.e,1)},0):(e(),a()):y=0}function c(e,n,o,i,r,c,l){function d(t){if(!p&&s(f.readyState)&&(w.r=p=1,!y&&a(),f.onload=f.onreadystatechange=null,t)){"img"!=e&&m(function(){E.removeChild(f)},50);for(var o in _[n])_[n].hasOwnProperty(o)&&_[n][o].onload()}}var l=l||u.errorTimeout,f=t.createElement(e),p=0,v=0,w={t:o,s:n,e:r,a:c,x:l};1===_[n]&&(v=1,_[n]=[]),"object"==e?f.data=n:(f.src=n,f.type=e),f.width=f.height="0",f.onerror=f.onload=f.onreadystatechange=function(){d.call(this,v)},g.splice(i,0,w),"img"!=e&&(v||2===_[n]?(E.insertBefore(f,b?null:h),m(d,l)):_[n].push(f))}function l(e,t,n,o,r){return y=0,t=t||"j",i(e)?c("c"==t?T:x,e,t,this.i++,n,o,r):(g.splice(this.i++,0,e),1==g.length&&a()),this}function d(){var e=u;return e.loader={load:l,i:0},e}var f,u,p=t.documentElement,m=e.setTimeout,h=t.getElementsByTagName("script")[0],v={}.toString,g=[],y=0,w="MozAppearance"in p.style,b=w&&!!t.createRange().compareNode,E=b?p:h.parentNode,p=e.opera&&"[object Opera]"==v.call(e.opera),p=!!t.attachEvent&&!p,x=w?"object":p?"script":"img",T=p?"script":x,C=Array.isArray||function(e){return"[object Array]"==v.call(e)},k=[],_={},j={timeout:function(e,t){return t.length&&(e.timeout=t[0]),e}};u=function(e){function t(e){var t,n,o,e=e.split("!"),i=k.length,r=e.pop(),s=e.length,r={url:r,origUrl:r,prefixes:e};for(n=0;n<s;n++)o=e[n].split("="),(t=j[o.shift()])&&(r=t(r,o));for(n=0;n<i;n++)r=k[n](r);return r}function s(e,i,r,s,a){var c=t(e),l=c.autoCallback;c.url.split(".").pop().split("?").shift(),c.bypass||(i&&(i=o(i)?i:i[e]||i[s]||i[e.split("/").pop().split("?")[0]]),c.instead?c.instead(e,i,r,s,a):(_[c.url]?c.noexec=!0:_[c.url]=1,r.load(c.url,c.forceCSS||!c.forceJS&&"css"==c.url.split(".").pop().split("?").shift()?"c":n,c.noexec,c.attrs,c.timeout),(o(i)||o(l))&&r.load(function(){d(),i&&i(c.origUrl,a,s),l&&l(c.origUrl,a,s),_[c.url]=2})))}function a(e,t){function n(e,n){if(e){if(i(e))n||(f=function(){var e=[].slice.call(arguments);u.apply(this,e),p()}),s(e,f,t,0,l);else if(Object(e)===e)for(c in a=function(){var t,n=0;for(t in e)e.hasOwnProperty(t)&&n++;return n}(),e)e.hasOwnProperty(c)&&(!n&&!--a&&(o(f)?f=function(){var e=[].slice.call(arguments);u.apply(this,e),p()}:f[c]=function(e){return function(){var t=[].slice.call(arguments);e&&e.apply(this,t),p()}}(u[c])),s(e[c],f,t,c,l))}else!n&&p()}var a,c,l=!!e.test,d=e.load||e.both,f=e.callback||r,u=f,p=e.complete||r;n(l?e.yep:e.nope,!!d),d&&n(d)}var c,l,f=this.yepnope.loader;if(i(e))s(e,0,f,0);else if(C(e))for(c=0;c<e.length;c++)l=e[c],i(l)?s(l,0,f,0):C(l)?u(l):Object(l)===l&&a(l,f);else Object(e)===e&&a(e,f)},u.addPrefix=function(e,t){j[e]=t},u.addFilter=function(e){k.push(e)},u.errorTimeout=1e4,null==t.readyState&&t.addEventListener&&(t.readyState="loading",t.addEventListener("DOMContentLoaded",f=function(){t.removeEventListener("DOMContentLoaded",f,0),t.readyState="complete"},0)),e.yepnope=d(),e.yepnope.executeStack=a,e.yepnope.injectJs=function(e,n,o,i,c,l){var d,f,p=t.createElement("script"),i=i||u.errorTimeout;p.src=e;for(f in o)p.setAttribute(f,o[f]);n=l?a:n||r,p.onreadystatechange=p.onload=function(){!d&&s(p.readyState)&&(d=1,n(),p.onload=p.onreadystatechange=null)},m(function(){d||(d=1,n(1))},i),c?p.onload():h.parentNode.insertBefore(p,h)},e.yepnope.injectCss=function(e,n,o,i,s,c){var l,i=t.createElement("link"),n=c?a:n||r;i.href=e,i.rel="stylesheet",i.type="text/css";for(l in o)i.setAttribute(l,o[l]);s||(h.parentNode.insertBefore(i,h),m(n,0))}}(this,document),Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0))}}(),function(e){"use strict";function t(e){return new RegExp("(^|\\s+)"+e+"(\\s+|$)")}function n(e,t){var n=o(e,t)?r:i;n(e,t)}var o,i,r;"classList"in document.documentElement?(o=function(e,t){return e.classList.contains(t)},i=function(e,t){e.classList.add(t)},r=function(e,t){e.classList.remove(t)}):(o=function(e,n){return t(n).test(e.className)},i=function(e,t){o(e,t)||(e.className=e.className+" "+t)},r=function(e,n){e.className=e.className.replace(t(n)," ")});var s={hasClass:o,addClass:i,removeClass:r,toggleClass:n,has:o,add:i,remove:r,toggle:n};"function"==typeof define&&define.amd?define(s):"object"==typeof exports?module.exports=s:e.classie=s}(window),function(e){function t(e){var t,n;return"x"===e?(t=m.clientWidth,n=window.innerWidth):"y"===e&&(t=m.clientHeight,n=window.innerHeight),t<n?n:t}function n(){return window.pageXOffset||m.scrollLeft}function o(){return window.pageYOffset||m.scrollTop}function i(){r()}function r(){[].slice.call(x).forEach(function(t,n){t.addEventListener("click",function(o){return o.preventDefault(),!(_||C===n||!e(t).hasClass("cs-loaded"))&&(_=!0,C=n,classie.add(t,"grid__item--loading"),void setTimeout(function(){classie.add(t,"grid__item--animate"),setTimeout(function(){s(t)},0)},0))})}),document.addEventListener("keydown",function(e){if(!_&&C!==-1){var t=e.keyCode||e.which;27===t&&(e.preventDefault(),"activeElement"in document&&document.activeElement.blur(),document.activeElement.blur(),document.activeElement.blur(),document.activeElement.blur(),a())}})}function s(n){var i=document.createElement("div");i.className="placeholder",f=e(n).offset().left-N,u=e(n).hasClass("grid__item--carousel")?e(".cs-rh-container").offset().top+parseInt(e(".row-horizon").css("padding-top"))-e(w).offset().top:n.offsetTop,i.style.WebkitTransform="translate3d("+f+"px, "+u+"px, 0px) scale3d("+n.offsetWidth/(b.offsetWidth+N+M+L)+","+n.offsetHeight/t("y")+",1)",i.style.transform="translate3d("+f+"px, "+u+"px, 0px) scale3d("+n.offsetWidth/(b.offsetWidth+N+M+L)+","+n.offsetHeight/t("y")+",1)",classie.add(i,"placeholder--trans-in"),b.appendChild(i),classie.add(p,"view-single"),setTimeout(function(){e(".cs-main").css("z-index","100000"),e("body").css("overflow-x","hidden"),i.style.WebkitTransform="translate3d("+-1*N+"px,"+-1*(e(".cs-grid").offset().top-o())+"px, 0px)",i.style.transform="translate3d("+-1*N+"px,"+-1*(e(".cs-grid").offset().top-o())+"px, 0px)",window.addEventListener("scroll",c)},25),y(i,function(){classie.remove(i,"placeholder--trans-in"),classie.add(i,"placeholder--trans-out"),E.style.top=o()-e(".cs-grid").offset().top+"px",classie.add(E,"content--show"),classie.add(T[C],"content__item--show"),classie.addClass(p,"noscroll"),_=!1,e(".content__item--show .cs-close").one("click",a),e(w).find("a").each(function(){e(this).removeClass("cs-loading cs-still-loading").removeAttr("style")}),e("body").css("overflow-y","hidden"),e("body").css("overflow-x",S),e(".scroll-wrap").css("overflow-y","scroll")})}function a(){e(".scroll-wrap").css("overflow-y","hidden"),e("body").css("overflow-y",j);var n=x[C],o=T[C];classie.remove(o,"content__item--show"),classie.remove(E,"content--show"),classie.remove(p,"view-single"),setTimeout(function(){var i=b.querySelector(".placeholder");classie.removeClass(p,"noscroll"),i.style.WebkitTransform="translate3d("+f+"px, "+u+"px, 0px) scale3d("+n.offsetWidth/(b.offsetWidth+N+M+L)+","+n.offsetHeight/t("y")+",1)",i.style.transform="translate3d("+f+"px, "+u+"px, 0px) scale3d("+n.offsetWidth/(b.offsetWidth+N+M+L)+","+n.offsetHeight/t("y")+",1)",i.style.backgroundColor="rgba(0, 0, 0, 0.6)",y(i,function(){e(".cs-main").css("z-index","50"),o.parentNode.scrollTop=0,b.removeChild(i),classie.remove(n,"grid__item--loading"),classie.remove(n,"grid__item--animate"),k=!1,window.removeEventListener("scroll",c)}),C=-1},25)}function c(){k||(k=!0,l=n(),d=o()),window.scrollTo(l,d)}var l,d,f,u,p=document.body,m=window.document.documentElement,h={transitions:Modernizr.csstransitions},v={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd",msTransition:"MSTransitionEnd",transition:"transitionend"},g=v[Modernizr.prefixed("transition")],y=function(e,t){var n=function(e){if(h.transitions){if(e.target!=this)return;this.removeEventListener(g,n)}t&&"function"==typeof t&&t.call(this)};h.transitions?e.addEventListener(g,n):n()},w=document.getElementById("cs-gallery")||document.getElementById("cs-carousel"),b=w.querySelector(".cs-grid"),E=w.querySelector(".cs-content"),x=b.querySelectorAll(".grid__item"),T=E.querySelectorAll(".content__item"),C=-1,k=!1,_=!1,j=e("body").css("overflow-y"),S=e("body").css("overflow-x"),L=window.innerWidth-e(document).width(),N=e(w).offset().left,M=e(window).width()-(e(w).offset().left+e(w).outerWidth());e(".cs-content").css("margin-left","-"+N+"px"),i()}(jQuery);