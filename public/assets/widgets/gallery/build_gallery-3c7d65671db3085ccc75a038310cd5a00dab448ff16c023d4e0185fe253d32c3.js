function cspBuildGallery(t,e){var n,i=function(t){t.addClass("cs-loading"),$("#cs-gallery a").css("pointer-events","none"),setTimeout(function(){t.hasClass("cs-loaded")||t.addClass("cs-still-loading")},1e3)},s=function(t){"function"!=typeof cspInitVideo?$.getScript(e+"/assets/widgets/gallery/story_video-43fe8aa3f7b935f07cb5d310d22a14ae7ef200da6e5331a9204175fe4b17ef60.js",function(){cspInitVideo(t)}):cspInitVideo(t)};$.getScript(e+"/assets/widgets/gallery/story_overlays-039ac0a17a69af7164984fec26c219ace67d4f98c947d0bcf9baaa0b5b17c11c.js"),t.on("click","a.published",function(e){e.preventDefault();var a=$(this);return a.hasClass("cs-loaded")?(setTimeout(function(){a.removeClass("cs-loading cs-still-loading")},300),!1):(i(a),void $.ajax({url:a.attr("href"),method:"GET",data:{is_widget:!0,window_width:$(window).width()},dataType:"jsonp"}).done(function(e){n=t.find(".content__item:nth-of-type("+(a.index()+1)+")"),$.when(n.html(e.html),a.addClass("cs-loaded")).then(function(){widgetsListener(n)}).then(function(){s(n),initLinkedIn(),t.find("a").removeAttr("style"),t.on("click touchend",".close-button-xs",function(){$(this).closest(".cs-content").find(".close-button").trigger("click")}),a[0].click()})}).fail(function(){}))}).find(".cs-grid").removeClass("hidden")}