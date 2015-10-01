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

console.log('companies.js');
var app = angular.module("CspApp", []);

// Required to POST/PUT/PATCH to Rails
app.config(["$httpProvider", function ($httpProvider) {
  $httpProvider.
    defaults.headers.common["X-CSRF-TOKEN"] =
      $("meta[name=csrf-token]").attr("content");
}]);
//

app.controller("MainCtrl", ['$scope', '$http', 'companyFactory',
  'customerFactory', 'productFactory', 'partnerFactory',
  function ($scope, $http, companyFactory, customerFactory,
    productFactory, partnerFactory) {

  $scope.tab = 1;

  $scope.tabSelected = function(checkTab) {
    return $scope.tab === checkTab;
  };

  $scope.selectTab = function(setTab) {
    $scope.tab = setTab;
    console.log(setTab);
  };

}]);

app.factory('companyFactory', ['$http', function ($http) {
  var companyFactory = {};
  return companyFactory;
}]);

app.factory('customerFactory', ['$http', function ($http) {
  var customerFactory = {};
  return customerFactory;
}]);

app.factory('productFactory', ['$http', function ($http) {
  var productFactory = {};
  return productFactory;
}]);

app.factory('partnerFactory', ['$http', function ($http) {
  var partnerFactory = {};
  return partnerFactory;
}]);