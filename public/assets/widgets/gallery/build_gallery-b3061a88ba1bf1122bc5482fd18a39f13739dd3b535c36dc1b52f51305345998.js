function cspBuildGallery(e,t){var n,i=function(e){e.addClass("cs-loading"),$("#cs-gallery a").css("pointer-events","none"),setTimeout(function(){e.hasClass("cs-loaded")||e.addClass("cs-still-loading")},1e3)},s=function(e){"function"!=typeof cspInitVideo?$.getScript(t+"/assets/widgets/gallery/story_video-43fe8aa3f7b935f07cb5d310d22a14ae7ef200da6e5331a9204175fe4b17ef60.js",function(){cspInitVideo(e)}):cspInitVideo(e)};$.getScript(t+"/assets/widgets/gallery/story_overlays-7e76159e0bb02b20e3a74081fabf6512ca67ed286435453f6337c435e59d3c04.js"),e.on("click","a.published",function(t){t.preventDefault();var o=$(this);return o.hasClass("cs-loaded")?(setTimeout(function(){o.removeClass("cs-loading cs-still-loading")},300),!1):(i(o),void $.ajax({url:o.attr("href"),method:"GET",data:{is_widget:!0,window_width:$(window).width()},dataType:"jsonp"}).done(function(t){n=e.find(".content__item:nth-of-type("+(o.index()+1)+")"),$.when(n.html(t.html),o.addClass("cs-loaded")).then(function(){widgetsListener(n)}).then(function(){s(n),initLinkedIn(),e.find("a").removeAttr("style"),e.on("click touchend",".close-button-xs",function(){$(this).closest(".cs-content").find(".close-button").trigger("click")}),o[0].click()})}).fail(function(){}))}).find(".cs-grid").removeClass("hidden")}