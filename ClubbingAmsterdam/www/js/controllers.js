angular.module('ionicApp.controllers', ['ionicApp.services', 'ngOpenFB'])

.controller('MainCtrl', function($scope, $state, $ionicSideMenuDelegate, Events, EventDetails, GetPouchDocs, ngFB) {
	// wait till device is ready
		//get sidebar max width
	    $scope.maxwidth = function(spacer) {
	    	var width2 = window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight;
	    	return width2 - spacer;
	    };
	    // get device width each rotate
	    window.addEventListener("orientationchange", function() {
	        //get sidebar max width
	    }, false);

	    $scope.toggleLeft = function() {
	        $ionicSideMenuDelegate.toggleLeft();
	    };
	    //sidebar swipe fix
	    document.addEventListener('touchstart', function(event) {
	        // workaround for Android
	        if ($ionicSideMenuDelegate.isOpenLeft() || $ionicSideMenuDelegate.isOpenRight()) {
	            event.preventDefault();
	        }
	    });

        //$scope.events = [];

        $scope.filter = [];
        $scope.filter.dateRange = [];
        $scope.filter.query = '';


        // Call the GetDocs factory functions to retreive the data from PouchDB
        GetPouchDocs.fetchInitialDocs().then(GetPouchDocs.reactToChanges).catch(console.log.bind(console));

        //$scope.remove = function(event) {
        //    Events.remove(event);
        //}
})

.controller('ListCtrl', function($scope, $state,$location, $filter, Events, EventDetails, PouchDBListener, ngFB) {
        // Facebook login code
       $scope.fbLogin = function () {
            ngFB.login({scope: 'email,read_stream,publish_actions'}).then(
                function (response) {
                    if (response.status === 'connected') {
                        console.log('Facebook login succeeded');
                        $scope.getFbEvent(709839699128487);
                        $scope.closeLogin();
                    } else {
                        alert('Facebook login failed');
                    }
                });
       };

       $scope.getFbEvent = function(eventID) {
           ngFB.api({
                /* search NOT WORKING???          path: '/search?q=Muze social' +  + '&type=event&center=52.372291564941,4.890764713287&distance=100',*/
               path: '/'+eventID+'',
               params: { fields: 'picture{url},cover{source},attending_count' }
           }).then(
              function (fbEvent) {
                  console.log(JSON.stringify(fbEvent.picture.data.url +' cov: '+fbEvent.cover.source +' attending: '+fbEvent.attending_count));
                  $scope.fbEvent = fbEvent;
              },
              function (error) {
                  //alert('Facebook error: ' + error.error_description);
              });
            };

        // populate thumbnails
        $scope.getFbEvent(709839699128487);

        //$scope.$parent.$parent.dateRange.dateMax = new Date("2020-07-23T22:00:00.000Z");
        //$scope.filter.dateRange.dateMin = new Date();

        $scope.toggleStar = function(event) {
            event.star = !event.star;
        };

        //pass eventID to the stateProvider to create event detail route.
        $scope.whichevent = $state.params.evId;
})
