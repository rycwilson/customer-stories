(function() {

  var jQuery;

  /******** Load jQuery if not present *********/
  if (window.jQuery === undefined) {
    var script_tag = document.createElement('script');
    script_tag.setAttribute("type", "text/javascript");
    script_tag.setAttribute("src",
      "https://ajax.googleapis.com/ajax/libs/jquery/1.12.3/jquery.min.js");
    if (script_tag.readyState) {
      script_tag.onreadystatechange = function () { // For old versions of IE
        if (this.readyState == 'complete' || this.readyState == 'loaded') {
          scriptLoadHandler();
        }
      };
    } else { // Other browsers
      script_tag.onload = scriptLoadHandler;
    }
    // Try to find the head, otherwise default to the documentElement
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
  } else {
  // The jQuery version on the window is the one we want to use
  jQuery = window.jQuery;
  main();
  }

/******** Called once jQuery has loaded ******/
function scriptLoadHandler() {
  // Restore $ and window.jQuery to their previous values and store the
  // new jQuery in our local jQuery variable
  jQuery = window.jQuery.noConflict(true);
  // Call our main function
  main();
}

/******** Our main function ********/
function main() {
  jQuery(document).ready(function ($) {

    // check for bootstrap 3 ...
    if (typeof $().emulateTransitionEnd !== 'function') {
      var bootstrap_css = $("<link>", {
        rel: "stylesheet",
        type: "text/css",
        href: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
        integrity: "sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7",
        crossorigin: "anonymous"
      });
      bootstrap_css.appendTo('head');
    }

    var widget_css = $("<link>", {
      rel: "stylesheet",
      type: "text/css",
      href: "http://customerstories.org/bootstrap.min.css",

    });


}

})(); // We call our anonymous function immediately