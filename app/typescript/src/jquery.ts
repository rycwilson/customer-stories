// this file is separate so that the global window assignments are run before other imports 
// in app.js that are dependent upon a global jQuery object (note imports are hoisted)
import jquery from 'jquery';
window.$ = jquery;
window.jQuery = jquery;

import 'blueimp-file-upload/js/jquery.fileupload';

// export {};