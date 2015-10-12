
// Angular plug-ins
//= require angular/angular.min
//= require angular-ui-router/release/angular-ui-router.min
//= require angular-sanitize/angular-sanitize.min
//= require angular-ui-select/dist/select.min
//= require ng-tags-input/ng-tags-input
//= require angular-base64-upload/src/angular-base64-upload

// MVP plug-ins
//= require slimscroll/jquery.slimscroll.min
//= require magnific-popup/dist/jquery.magnific-popup.min
//= require mvpready-admin

(function() {

  var app = angular.module("CspApp", ['ui.router', 'ui.select', 'ngSanitize',
            'naif.base64']);

  // Required to POST/PUT/PATCH to Rails
  app.config(["$httpProvider", function ($httpProvider) {
    $httpProvider.defaults.headers.common["X-CSRF-TOKEN"] =
      $("meta[name=csrf-token]").attr("content");
  }]);

  // TODO: angular-ui-router
  app.config(["$stateProvider", "$urlRouterProvider",
      function ($stateProvider, $urlRouterProvider) {
    // $urlRouterProvider.otherwise('/home');

    // $stateProvider
    //     // HOME STATES AND NESTED VIEWS ========================================
    //     .state('dashboard', {
    //         url: '/account',
    //         templateUrl: 'companies/show.html.erb'
    //     })
    //     // ABOUT PAGE AND MULTIPLE NAMED VIEWS =================================
    //     .state('show-stories', {
    //         // we'll get to this in a bit
    //     })
    //     .state('show-story', {
    //         // we'll get to this in a bit
    //     })
    //     .state('edit-story', {
    //         // we'll get to this in a bit
    //     });
  }]);

  // angular-ui-select options
  // app.config(function (uiSelectConfig) {
  //   uiSelectConfig.theme = 'bootstrap';
  //   uiSelectConfig.resetSearchInput = true;
  //   uiSelectConfig.appendToBody = true;
  // });

  app.controller("MainCtrl",
      ['companyFactory', function (companyFactory) {

    var company = this;

    company.id = null;
    company.name = null;
    company.logo = null;
    company.logo_path = null;
    company.customers = [];
    company.successes = [];
    company.stories = [];
    company.industryTags = [];
    company.preDefIndTags = ['Education', 'Government', 'Financial Services', 'Healthcare', 'Hospitality', 'Manufacturing', 'Media and Entertainment', 'Service Provider', 'Technology', 'IT', 'Telecommunications'];
    company.productTags = [];
    company.preDefProdTags = [];
    company.tab = 1;

    company.newLogo = null;

    getCompany();

    company.checkLogoPath = function () {
      return company.logo_path;
    };

    company.create = function () {
      companyFactory.createCompany(company.name,
                                   company.newLogo,
                                   company.industryTags,
                                   company.productTags)
        .success(function (data, status) {
          console.log('createCompany success: ', data, status);
          company.tab = 1;
          company.logo_path = data.logo_url;
          company.newLogo = null;
        })
        .error(function (data, status) {
          // this returns null (data) and -1 (status)
          // TODO: send helpful error response from server
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
      companyFactory.getCompany()
        .success(function (data) {
          if (!data.id) {
            // new company, go to registration tab
            company.tab = 2;
          }
          else {
            console.log('data: ', data);
            company.id = data.id;
            company.name = data.name;
            company.logo = data.logo_file_name;
            company.logo_path = data.logo_url;
            company.customers = data.customers;
            company.successes = data.successes;
            company.stories = data.stories;
            company.industryTags = data.industry_categories;
            company.productTags = data.product_categories;

            // $scope.$watch(company.logo, function (newValue, oldValue) {
            //   console.log('logo changed');
            //   company.newLogo = true;
            // }, true);
          }
        })
        .error(function (error) {
          console.log(error);
        });
    }

  }]);

  app.factory('companyFactory', ['$http', function ($http) {
    var companyFactory = {
      company: {},
      getCompany: getCompany,
      createCompany: createCompany,
    };
    return companyFactory;
    function getCompany () {
      return $http.get("/account.json")
        .success(function (data) {
          companyFactory.company = data;
        });
    }
    function createCompany (name, logo, industryTags, productTags) {
      return $http.post("/account.json",
          { company: { name: name, logo: logo },
             industry_tags: industryTags,
             product_tags: productTags })
        .success(function (data) {
          companyFactory.company = data;
        });
    }
  }]);


// Data-binding debugging tool
// Uncomment all this and whenever an expression {{ }} is evaluated,
// results will log to the console.
// WARNING: This can sometimes break things
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