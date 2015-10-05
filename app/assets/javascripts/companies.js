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

  app.controller("CompanyController", ['$http', 'companyService',
    function ($http, companyService) {

    var company = this;

    company.id = null;
    company.name = null;
    company.customers = [];
    company.successes = [];
    company.stories = [];
    company.tab = 1;

    getCompany();

    company.create = function () {
      companyService.createCompany(company.name)
        .success(function (data, status) {
          console.log('createCompany success: ', data, status);
          company.id = data.id;
          company.name = data.name;
          company.tab = 1;
        })
        .error(function (data, status) {
          console.log('createCompany error: ', data, status);
        });
      $('#new-company-submit').blur();
    };

    company.getStoryCustomer = function (story) {
      success = $.grep(company.successes, function (success) {
        return success.id === story.success_id;
      })[0];
      customer = $.grep(company.customers, function (customer) {
        return customer.id === success.customer_id;
      })[0];
      return customer.name;
    };

    company.tabSelected = function (checkTab) {
      return company.tab === checkTab;
    };

    company.selectTab = function (setTab) {
      company.tab = setTab;
    };

    function getCompany() {
      companyService.getCompany()
        .success(function (data) {
          if (!data.id) {
            // new company
            company.tab = 2;
          }
          else {
            company.id = data.id;
            company.name = data.name;
            company.customers = data.customers;
            company.successes = data.successes;
            company.stories = data.stories;
          }
        })
        .error(function (error) {
          console.log(error);
        });
    }

  }]);

  app.factory('companyService', ['$http', function ($http) {
    var companyService = {
      company: [],
      getCompany: getCompany,
      createCompany: createCompany
    };
    return companyService;
    function getCompany () {
      return $http.get("/account.json")
        .success(function (data) {
          companyService.company = data;
        });
    }
    function createCompany (name) {
      return $http.post("/account.json", { company: { name: name }})
        .success(function (data) {
          companyService.company = data;
        });
    }
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