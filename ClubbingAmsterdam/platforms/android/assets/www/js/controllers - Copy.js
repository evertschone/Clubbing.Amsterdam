angular.module('ionicApp.controllers', ['ionicApp.services', 'ngOpenFB'])


.controller('MainCtrl', ['$scope', function($scope, $state, $ionicSideMenuDelegate, Events, ngFB) {
	// wait till device is ready

		//get sidebar max width
	    $scope.maxwidth = function(spacer) {
	    	var width2 = window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight
	    	return width2 - spacer
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

        //$scope.remove = function(event) {
        //    Events.remove(event);
        //}
}])

.controller('ListCtrl', function($scope, $state, Events, ngFB) {
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
                  alert('Facebook error: ' + error.error_description);
              });
            };

        //This is the callback function for the Events service
        setData = function(data) {
            $scope.events = data.feed.entry
            // console.log('entries ?' +  JSON.stringify($scope.events) ); 
        };
        // this calls the function
        Events.all(setData);
        // populate thumbnails
        $scope.getFbEvent(709839699128487);

        $scope.toggleStar = function(event) {
            event.star = !event.star;
        }

        //pass eventID to the stateProvider to create event detail route.
        $scope.whichevent = $state.params.evId;
})

.controller('CheckinCtrl', function($scope) {
    $scope.showForm = true;

    $scope.shirtSizes = [{
        text: 'Large',
        value: 'L' 
    }, {
        text: 'Medium',
        value: 'M'
    }, {
        text: 'Small',
        value: 'S'
    }];

    $scope.attendee = {};
    $scope.submit = function() {
        if (!$scope.attendee.firstname) {
            alert('Info required');
            return;
        }
        $scope.showForm = false;
        $scope.attendees.push($scope.attendee);
    };

})

.controller('AttendeesCtrl', function($scope) {

    $scope.activity = [];
    $scope.arrivedChange = function(attendee) {
        var msg = attendee.firstname + ' ' + attendee.lastname;
        msg += (!attendee.arrived ? ' has arrived, ' : ' just left, ');
        msg += new Date().getMilliseconds();
        $scope.activity.push(msg);
        if ($scope.activity.length > 3) {
            $scope.activity.splice(0, 1);
        }
    };

})

.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, Chats) {
    $scope.chats = Chats.all();
    $scope.remove = function(chat) {
        Chats.remove(chat);
    }
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
    $scope.settings = {
        enableFriends: true
    };
});