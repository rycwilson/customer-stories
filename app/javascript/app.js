// Entry point for the build script in your package.json
import jquery from './jquery.js';   // creates global $, jQuery
import {} from 'jquery-ujs/src/rails.js';
import {} from 'jquery-ui/dist/jquery-ui.js';
import {} from 'bootstrap-sass-3.3.6/assets/javascripts/bootstrap/tab.js';
import Cookies from 'js-cookie';

import dashboard from './views/dashboard';

dashboard.addListeners();