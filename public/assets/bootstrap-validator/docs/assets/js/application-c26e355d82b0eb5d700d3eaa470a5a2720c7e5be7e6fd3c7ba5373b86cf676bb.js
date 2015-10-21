/*!
 * Copyright 2013 Twitter, Inc.
 *
 * Licensed under the Creative Commons Attribution 3.0 Unported License. For
 * details, see http://creativecommons.org/licenses/by/3.0/.
 */
!function(t){t(function(){var o=t(window),n=t(document.body),e=t(".navbar").outerHeight(!0)+10;n.scrollspy({target:".bs-sidebar",offset:e}),o.on("load",function(){n.scrollspy("refresh")}),t(".bs-docs-container [href=#]").click(function(t){t.preventDefault()}),setTimeout(function(){var o=t(".bs-sidebar");o.affix({offset:{top:function(){var n=o.offset().top,e=parseInt(o.children(0).css("margin-top"),10),r=t(".bs-docs-nav").height();return this.top=n-r-e},bottom:function(){return this.bottom=t(".bs-footer").outerHeight(!0)}}})},100)})}(window.jQuery);