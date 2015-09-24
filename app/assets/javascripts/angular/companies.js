
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

  $scope.tabSelected = function(checkTab) {
    return $scope.tab === checkTab;
  };

  $scope.selectTab = function(setTab) {
    $scope.tab = setTab;
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