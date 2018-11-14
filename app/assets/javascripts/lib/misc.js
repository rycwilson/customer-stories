
/**
 * Get the value of a querystring
 * @param  {String} param The parameter to get the value of
 * @param  {String} url   The URL to get the value from (optional)
 * @return {String}       The param value
 */
function getQueryParam (param, url) {
    var href = url ? url : window.location.href;
    var reg = new RegExp( '[?&]' + param + '=([^&#]*)', 'i' );
    var string = reg.exec(href);
    return string ? string[1] : null;
}

