function setAppData(){window.gon,CSP.company=window.gon&&gon.company||CSP.company||null,CSP.stories=window.gon&&gon.stories||CSP.stories||null,CSP.current_user=window.gon&&gon.current_user||CSP.current_user||null,CSP.env=window.gon&&gon.env||CSP.env||null,CSP.charts=window.gon&&gon.charts||CSP.charts||null,getScreenSize()}function attachAppListeners(){xScrollBoundaries(),$(document).on("click","#workflow-tabs a",function(t){t.preventDefault();var o=window.location.pathname,n="/"+$(this).attr("href").slice(1,$(this).attr("href").length);$("body").hasClass("companies show")?(window.history.replaceState({turbolinks:!1},null,o),window.history.pushState({turbolinks:!0},null,n)):Turbolinks.visit(n)}).on("click",'a[href*="/settings"], a[href="/user-profile"]',function(){var t=$(this).closest("li.dropdown"),o=t.parent().find("li.dropdown:not(.open)");t.addClass("active"),o.removeClass("active")}).on("click",'button[type="submit"]',function(t){if($(this).hasClass("disabled"))return t.preventDefault(),t.stopImmediatePropagation(),!1;var o=$(this).closest("form").length&&$(this).closest("form")||$("#"+$(this).attr("form"));$(this);if(o.is("#customer-form")||o.is("#contribution-request-form")||o.is('[id*="contribution-form-"]')||o.is("#new-story-form")||o.is("#story-settings-form")||o.is("#story-content-form")||o.is("#promote-settings-form")||o.is("#adwords-sync-form")||o.is("#company-tags-form")||o.is("#new-cta-form")||o.is('[id*="cta-"]')||o.is("#submission-form")){if(o.data("submitted"))return t.preventDefault(),!1;toggleFormWorking(o)}}),window.onpopstate=function(){var t=window.location.pathname.match(/(prospect|curate|promote|measure)(\/(\w|-)+)?/),o=t&&t[1],n=o&&"curate"===o?t[2]?"story":"stories":null;o&&($('#workflow-tabs a[href="#'+o+'"]').tab("show"),n&&($('a[href="#curate-'+n+'"]').tab("show"),setTimeout(function(){window.scrollTo(0,0)},1),"stories"===n&&$("#curate-filters .curator").val($("#curate-filters .curator").children('[value="'+CSP.current_user.id.toString()+'"]').val()).trigger("change",{auto:!0})))},$(document).on("turbolinks:click",function(){}).on("turbolinks:before-visit",function(){}).on("turbolinks:request-start",function(){}).on("turbolinks:visit",function(){}).on("turbolinks:request-end",function(){}).on("turbolinks:before-cache",function(){deconstructPlugins()}).on("turbolinks:before-render",function(){}).on("turbolinks:render",function(){document.documentElement.hasAttribute("data-turbolinks-preview")&&constructPlugins()})}var socialShareRedirectURI=new URL(location).searchParams.get("redirect_uri");$(document).one("turbolinks:load",function(){attachAppListeners(),attachCompaniesListeners(),attachStoriesListeners(),attachProfileListeners(),attachContributionsListeners()}),$(document).on("turbolinks:load",function(){setAppData(),constructPlugins(),CSP.init()});