'use strict';
/* global google */

function cdDojoDetailCtrl($scope, $state, $location, cdDojoService, cdUsersService, alertService, usSpinnerService, auth, dojo, gmap, $translate, currentUser, dojoUtils) {
  $scope.dojo = dojo;
  $scope.model = {};
  $scope.markers = [];
  $scope.requestInvite = {};
  $scope.userMemberCheckComplete = false;
  currentUser = currentUser.data;
  var approvalRequired = ['mentor', 'champion'];

  var latitude, longitude;

  if(!_.isEmpty(currentUser)) {
    if(!dojo || !dojo.id){
      return $state.go('error-404-no-headers');
    }

    if(!dojo.verified && dojo.creator !== currentUser.id && !_.contains(currentUser.roles, 'cdf-admin')){
      return $state.go('error-404-no-headers');
    }

    //Check if user is a member of this Dojo
    var query = {dojoId:dojo.id, userId: currentUser.id};
    cdDojoService.getUsersDojos(query, function (response) {
      $scope.dojoMember = !_.isEmpty(response);
      $scope.dojoOwner = false;
      if($scope.dojoMember) $scope.dojoOwner = (response[0].owner === 1) ? true : false;
      $scope.userMemberCheckComplete = true;
    });
  } else {
    if(!dojo || !dojo.id || !dojo.verified) return $state.go('error-404-no-headers');
    $scope.userMemberCheckComplete = true;
  }

  cdUsersService.getInitUserTypes(function (response) {
    var userTypes = _.filter(response, function(type) { return type.name.indexOf('u13') === -1; });
    $scope.initUserTypes = userTypes;
  });

  cdDojoService.getDojoConfig(function(json){
    $scope.dojoStages = _.map(json.dojoStages, function(item){
      return { value: item.value, label: $translate.instant(item.label) };
    });
    $scope.dojo.stage = _.find($scope.dojoStages, function(obj) { return obj.value === $scope.dojo.stage })
  });

  $scope.$watch('model.map', function(map){
    if(map) {
      if(latitude && longitude) {
        var marker = new google.maps.Marker({
          map: $scope.model.map,
          position: new google.maps.LatLng(latitude, longitude)
        });
        $scope.markers.push(marker);
      }
    }
  });

  if(gmap) {
    if($scope.dojo.coordinates) {
      var coordinates = $scope.dojo.coordinates.split(',');
      latitude  = coordinates[0];
      longitude = coordinates[1];
      $scope.mapOptions = {
        center: new google.maps.LatLng(latitude, longitude),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      $scope.mapLoaded = true;
    } else {
      var countryCoordinates;
      cdDojoService.loadCountriesLatLongData(function (response) {

        countryCoordinates = response[$scope.dojo.alpha2];

        $scope.mapOptions = {
          center: new google.maps.LatLng(countryCoordinates[0], countryCoordinates[1]),
          zoom: 5,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        $scope.mapLoaded = true;
      });
    }
  }

  $scope.userTypeSelected = function ($item) {
    if(_.contains(approvalRequired, $item)) return $scope.approvalRequired = true;
    return $scope.approvalRequired = false;
  };

  $scope.leaveDojo = function () {
    usSpinnerService.spin('dojo-detail-spinner');
    cdDojoService.removeUsersDojosLink({userId: currentUser.id, dojoId: dojo.id, emailSubject: $translate.instant('A user has left your Dojo')}, function (response) {
      usSpinnerService.stop('dojo-detail-spinner');
      $state.go($state.current, {}, {reload: true});
    }, function (err) {
      alertService.showError($translate.instant('Error leaving Dojo'));
    });
  }

  function removeCookie(name){
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT,;';
  }

  $scope.showBanner = function() {
    var dojoUrlSlug = document.cookie.replace(/(?:(?:^|.*;\s*)dojoUrlSlug\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    if(dojoUrlSlug.indexOf("/dojo")>=0){
      return true;
    } else {
      return false;
    }
  }
}

angular.module('cpZenPlatform')
  .controller('dojo-detail-controller', ['$scope', '$state', '$location', 'cdDojoService', 'cdUsersService', 'alertService', 'usSpinnerService', 'auth', 'dojo', 'gmap', '$translate', 'currentUser', 'dojoUtils', cdDojoDetailCtrl]);

