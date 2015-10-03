//= require angular/angular.min

// MVP plug-ins
//= require slimscroll/jquery.slimscroll.min
//= require flot/excanvas.min
//= require flot/jquery.flot
//= require flot/jquery.flot.pie
//= require flot/jquery.flot.resize
//= require flot/jquery.flot.time
//= require flot.tooltip/js/jquery.flot.tooltip
//= require mvpready-admin

(function() {

  var app = angular.module("Company", []);

  // Required to POST/PUT/PATCH to Rails
  app.config(["$httpProvider", function ($httpProvider) {
    $httpProvider.defaults.headers.common["X-CSRF-TOKEN"] =
      $("meta[name=csrf-token]").attr("content");
  }]);

  app.controller("CompanyController", ['$http', 'companyFactory',
    function ($http, companyFactory) {

    this.id = null;
    this.name = null;
    this.customers = [];
    this.successes = [];
    this.stories = [];
    this.err = null;
    this.tab = 1;

    getCurrentCompany(this);

    this.getStoryCustomer = function (story) {
      success = $.grep(this.successes, function (success) {
        return success.id === story.success_id;
      })[0];
      customer = $.grep(this.customers, function (customer) {
        return customer.id === success.customer_id;
      })[0];
      return customer.name;
    };

    this.tabSelected = function (checkTab) {
      return this.tab === checkTab;
    };

    this.selectTab = function (setTab) {
      this.tab = setTab;
    };

    function getCurrentCompany(scope) {
      companyFactory.getCurrentCompany()
        .success(function (company) {
          scope.id = company.id;
          scope.name = company.name;
          scope.customers = company.customers;
          scope.successes = company.successes;
          scope.stories = company.stories;
        })
        .error(function (error) {
          scope.err = error.message;
        });
    }

  }]);

  app.factory('companyFactory', ['$http', function ($http) {
    var companyFactory = {};
    companyFactory.getCurrentCompany = function() {
      return $http.get("/account.json");
    };
    return companyFactory;
  }]);


// Data-binding debugging tool
// Uncomment all this and whenever an expression {{ }} is evaluated,
// results will log to the console.
// app.config(['$provide', function ($provide) {
//   $provide.decorator("$interpolate", ['$delegate', function ($delegate) {
//     var interpolateWrap = function() {
//       var interpolationFn = $delegate.apply(this, arguments);
//         if(interpolationFn) {
//           return interpolationFnWrap(interpolationFn, arguments);
//         }
//     };
//     var interpolationFnWrap = function(interpolationFn, interpolationArgs) {
//       return function() {
//         var result = interpolationFn.apply(this, arguments);
//         var log = result ? console.log : console.warn;
//         log.call(console, "interpolation of  " + interpolationArgs[0].trim(),
//             ":", result.trim());
//         return result;
//       };
//     };
//     angular.extend(interpolateWrap, $delegate);
//     return interpolateWrap;
//   }]);
// }]);

})();