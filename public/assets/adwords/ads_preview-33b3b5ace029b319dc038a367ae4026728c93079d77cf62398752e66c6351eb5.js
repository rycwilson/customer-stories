$(function(){$(".grid").masonry({itemSelector:".grid-item",columnWidth:160,gutter:30,isInitLayout:!1}),$(".grid").imagesLoaded(function(){$(".grid").masonry()}),$(".grid").masonry("on","layoutComplete",function(){$(".grid").css("visibility","visible")});var i=0;setInterval(function(){$(".slide-up-down").animate({top:i%2===0?"-=50":"+=50"}),i++},4e3)});