angular.module('ionicApp.controllers', ['ionicApp.services', 'ngOpenFB'])

.controller('MainCtrl', function($scope, $state, $ionicSideMenuDelegate, $location, GetPouchDocs, EventsService, ngFB) {

    var MAXWIDTH = 600;
    //get sidebar max width
    $scope.maxwidth = function(spacer) {
        var windowWidth = window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight;
        if (windowWidth < MAXWIDTH) {
            return windowWidth - spacer;
        } else {
            return MAXWIDTH - spacer;
        }
    };

    // toggle sidebar function
    $scope.toggleLeft = function() {
        $ionicSideMenuDelegate.toggleLeft();
    };

    //sidebar swipe fix
    document.addEventListener('touchstart', function(event) {
        // workaround for Android
        if ($ionicSideMenuDelegate.isOpenRight()) {
            event.preventDefault();
        }
    });

    // init scope variables
    $scope.filter = [];
    $scope.filter.dateRange = [];
    $scope.filter.query = '';
    $scope.filter.price = 100;
    $scope.filter.priceOperator = 0;
    $scope.filter.attendance = 0;
    $scope.filter.attendanceOperator = 1;
    $scope.filter.ratio = 0;
    $scope.filter.ratioOperator = 1;
    $scope.filter.distance = 10;
    $scope.filter.distanceOperator = 0;
    $scope.filter.outdoor = 0;

    $scope.filter.apply = false;

    $scope.ADDNUMBER = 20;
    $scope.BASELIMIT = 20;

    //init date filters
    var now = new Date().getTime();
    var oneWeek = 6 * 24 * 60 * 60 * 1000;
    $scope.filter.dateRange.dateMin = new Date(now);
    $scope.filter.dateRange.dateMax = new Date(now + oneWeek);
    $scope.sortVal = 'json.startDate';
    $scope.reverse = 0;
   //$scope.events = {};
    //$scope.filteredEvents = {};
    var shown =0;


    //location based hiding of back/ filter button
    $scope.$on('$locationChangeStart',setbuttons);
    function setbuttons() {
        if($location.path() == '/events'){
          $scope.buttonHack = 'block !important';
          console.log(1, $location.path());
        }else if($location.path() == '/events/eventlist'){
          $scope.buttonHack = '';
          console.log(2 , $location.path());
        }else if($location.path().indexOf('/events/') === 0 ){
          $scope.buttonHack = '';
          console.log(3, $location.path());
        }
    }

    // Count watchers function
    $scope.count = function() {
        var root = angular.element(document.getElementsByTagName('body'));

        var watchers = [];

        var f = function(element) {
            angular.forEach(['$scope', '$isolateScope'], function(scopeProperty) {
                if (element.data() && element.data().hasOwnProperty(scopeProperty)) {
                    angular.forEach(element.data()[scopeProperty].$$watchers, function(watcher) {
                        watchers.push(watcher);
                    });
                }
            });

            angular.forEach(element.children(), function(childElement) {
                f(angular.element(childElement));
            });
        };

        f(root);

        // Remove duplicate watchers
        var watchersWithoutDuplicates = [];
        angular.forEach(watchers, function(item) {
            if (watchersWithoutDuplicates.indexOf(item) < 0) {
                watchersWithoutDuplicates.push(item);
            }
        });

        $scope.result = watchersWithoutDuplicates.length;
    };

    // Populates the Event list, places stored pouchDB events on the $rootscope, then monitors and lazy loads missing/changed events from the CouchDB Sever.
    GetPouchDocs.fetchInitialDocs().then(GetPouchDocs.reactToChanges).catch(console.log.bind(console));

})

.controller('ListCtrl', function($scope, $rootScope, $timeout, $state, $location, $filter, $ionicScrollDelegate, $ionicPopup, geoLocationService, GetPouchDocs, EventsService, ngFB) {
    // static vars

    $scope.MF_NO_P = 20;
    $scope.MF_LOW_P = 40;
    $scope.MF_MID_P = 70;
    //$scope.MF_HIGH_P = infinite;

    $scope.filter.listLimit = $scope.BASELIMIT;

    //in your controller Apply filters
    var newEvents;
    var newQuery;
    var newDateRange;
    var newDistance = 10;
    var newDistanceOperator = 0;
    var newOutdoor;
    var newPrice;
    var newRatio;
    var confirmVisible=0;

    $scope.$watchGroup(['$rootScope.events', 'filter.query', 'filter.apply'], function(newValues, oldValues, scope) {

        if(newValues[2]) {
           $scope.filter.apply = false;
          //oldvalues
        oldEvents = newEvents;
        oldQuery = newQuery;
        oldDateRange = newDateRange;
        oldDistance = newDistance;
        oldDistanceOperator = newDistanceOperator;
        oldOutdoor = newOutdoor;

//'', '', '', '', '','','','','','','',
        //newvalues
        newEvents = newValues[0];
        newQuery = newValues[1];
        newDateRange = {
            dateMin: $scope.filter.dateRange.dateMin,
            dateMax: $scope.filter.dateRange.dateMax
        };
        newDistance = $scope.filter.distance;
        newDistanceOperator = $scope.filter.distanceOperator;
        newOutdoor = $scope.filter.outdoor;
        newPrice = $scope.filter.price;
        newPriceOperator = $scope.filter.priceOperator;
        newAttendance = $scope.filter.attendance;
        newAttendanceOperator = $scope.filter.attendanceOperator;
        newRatio = $scope.filter.ratio;
        newRatioOperator = $scope.filter.ratioOperator;

        //changed? (use for smart reapply only one filter? )
        changedEvents = newEvents != oldEvents;
        changedQuery = newQuery != oldQuery;
        changedOutdoor = oldOutdoor != newOutdoor;
        changedDistance = (newDistance != oldDistance) || (newDistanceOperator != oldDistanceOperator);

        //Apply DateRange filter to init filteredEvents
        $scope.filteredEvents = $filter('rangeFilter')($scope.events, newDateRange);

        if (newQuery) {
            console.log('QUERY');
            $scope.filteredEvents = $filter('filter')($scope.filteredEvents, newQuery);
            //$scope.toggleLeft();
        }

        if ( $scope.currentPosition) {
            $scope.filteredEvents = $filter('distanceFilter')($scope.filteredEvents, newDistance, newDistanceOperator, $scope.currentPosition);
        }else if (!$scope.currentPosition && changedDistance) {
            console.log($scope.currentPosition+' dist'+$scope.filter.distance + ' '  + newDistance);
              $timeout( function(){
                if (!confirmVisible ) $scope.showConfirm();
                confirmVisible=1;
              }, 4);
        }

        $scope.filteredEvents = $filter('hasProperty')($scope.filteredEvents, 'json.location[0].locType', 'buiten',newOutdoor);
        $scope.filteredEvents = $filter('priceFilter')($scope.filteredEvents, newPrice, newPriceOperator);
        $scope.filteredEvents = $filter('attendanceFilter')($scope.filteredEvents, newAttendance, newAttendanceOperator);
        $scope.filteredEvents = $filter('ratioFilter')($scope.filteredEvents, newRatio, newRatioOperator);

        }
    });

      $scope.showConfirm = function() {
          //if(!confirmPopup){
            var confirmPopup = $ionicPopup.confirm({
             title: 'Location needed',
             template: 'your location is needed for this, turn on location services?'
            });

            confirmPopup.then(function(res) {

             if(res){
               //shown =1;{
               console.log('You are sure');
               $scope.recording(true);
             } else {
              //shown =1;
               //$scope.filter.distance=10;
               console.log('You are not sure');
             }

            });
         // }

        };

    //check if there are still items to show.
    $scope.moreDataCanBeLoaded = function() {
        //$scope.events.filter($scope.filter.query) && $scope.rangeFilter($scope.filter.dateRange).length
        //console.log($rootScope.events);
        return ($scope.filteredEvents && $scope.filteredEvents.length > $scope.filter.listLimit);
    };

    $scope.addMoreItems = function() {
        //show loading spinner
        $scope.myStyle = {
            opacity: 1,
            display: 'block'
        };
        //timeout hack to hide loading when items are added
        $timeout(function() {
            $scope.filter.listLimit += $scope.ADDNUMBER; // load x more items
            $scope.$broadcast('scroll.infiniteScrollComplete');
            $scope.myStyle = {
                opacity: 0
            };
        }, 20);
    };

    //navigate to path, go(path);
    $scope.go = function(path) {
        $location.path(path);
    };

    // scroll list to top
    $scope.scrollListToTop = function() {
        $ionicScrollDelegate.scrollTop();
    };


    // GET GEOLOC DATA
    function onChange(newPosition) {
        var currentPositionObj = newPosition.coords;
        currentPositionObj.timestamp = newPosition.timestamp;
        $scope.currentPosition = currentPositionObj;
        $scope.useGeo = true;
    }

    function onChangeError(error) {
        //$scope.useGeo = false;
        console.log("Error: " + error);
    }

    $scope.recording = function(on) {
        if (on) {
            geoLocationService.start(onChange, onChangeError);
            $scope.useGeo = true;
        } else {
            geoLocationService.stop();
            $scope.useGeo = false;
        }
    };

    //$scope.recording(true);
    //$scope.recording(false);

    // distance calc function
    $scope.getDistance = function(item) {
        starting = $scope.currentPosition;
        var ending = {};
        eventLoc = item.json.geoLoc.split(' ');
        ending.latitude = Number(eventLoc[0]);
        ending.longitude = Number(eventLoc[1]);
        //console.log(starting);
        return calculateDistance(starting, ending);

    };

    // Sorting logic, reverse sort for attending because you want to see high first
    var prevSelect;

    $scope.sortSelectValue = function() {
        if ($scope.sortVal == "json.facebook[0].fbAttending") {
            $timeout( prevSelect = 'attending', 1000 );
            $scope.reverse = !$scope.reverse;
        } else if (prevSelect == 'attending') {
            prevSelect = 'other';
            $scope.reverse = !$scope.reverse;
        }
    };

    var gcd = function(a, b) {
      if (!b) return a;
        a = parseInt(a);
        b = parseInt(b);
      return gcd(b, a % b);
    };

    $scope.ratioFrac = function(percent) {
      var fraction = (Math.round(percent/10)/10);
      var len = fraction.toString().length - 2;
      var denominator = Math.pow(10, len);
      var numerator = fraction * denominator;
      var divisor = gcd(numerator, denominator);
      numerator /= divisor;
      denominator /= divisor;
      ratioNumerator = denominator.toFixed() - numerator.toFixed();
      return numerator.toFixed() + ':' + ratioNumerator;
    };

    $scope.isNumber = angular.isNumber;


    $scope.sortSelect = function(item) {
        // SORT LOCATION
        if ($scope.sortVal == 'json.geoLoc') {
            if (item.json.geoLoc) {
                starting = $scope.currentPosition;
                var ending = {};
                eventLoc = item.json.geoLoc.split(' ');
                ending.latitude = Number(eventLoc[0]);
                ending.longitude = Number(eventLoc[1]);
                //console.log(starting);
                return Number(calculateDistance(starting, ending));
            }
            // SORT PRICE
        } else if ($scope.sortVal == 'json.prices[0].price') {
            if (item.json.lowestPrice) {
                lowestPriceSort = item.json.lowestPrice;
                if (lowestPriceSort == 'free') {
                  lowestPriceSort = -1;
                }else if (lowestPriceSort == 'free*') {
                  lowestPriceSort = 0;
                }else if (lowestPriceSort == 'soldout!') {
                  lowestPriceSort = 99999;
                }
                return lowestPriceSort;
            } else {
                return $scope.reverse ? -10000000 : 1000000;
            }
            // SORT DATE
        } else if ($scope.sortVal == 'json.startDate') {
            if (item.json.startDate) {
                return item.json.startDate;
            }
            // SORT NAME
        } else if ($scope.sortVal == 'json.name') {
            if (item.json.name) {
                return item.json.name;
            }
            // SORT ATTENDING
        } else if ($scope.sortVal == 'json.facebook[0].fbAttending') {
            if (item.json.facebook[0] && item.json.facebook[0].fbAttending) {
                return item.json.facebook[0].fbAttending;
            } else {
                return $scope.reverse ? -10000000 : 1000000;
            }
            // SORT MF RATIO
        } else if ($scope.sortVal == 'json.facebook[0].fbMFRatio') {
            if (item.json.facebook[0] && item.json.facebook[0].fbMFRatio) {
                // if high enough probability
                if (item.json.facebook[0].fbMFRatioN > $scope.MF_NO_P) {
                    return item.json.facebook[0].fbMFRatio;
                } else {
                    return $scope.reverse ? -10000000 : 1000000;
                }
            } else {
                return $scope.reverse ? -10000000 : 1000000;
            }
            // SORT UNKNOWN
        } else {
            console.log(' UNKNOWN SORT PARAM');
            return;
        }
    };


    $scope.toggleStar = function(event) {
        localDB.get(event.json.id).then(function(doc) {
            doc.star = !doc.star;
            return userDB.put(doc);
        }).then(function(response) {
            // handle response
        }).catch(function(err) {
            console.log(err);
        });
    };

    // Facebook login code
    $scope.fbLogin = function() {
        ngFB.login({
            scope: 'email,read_stream,publish_actions'
        }).then(
            function(response) {
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
            path: '/' + eventID + '',
            params: {
                fields: 'picture{url},cover{source},attending_count'
            }
        }).then(
            function(fbEvent) {
                console.log(JSON.stringify(fbEvent.picture.data.url + ' cov: ' + fbEvent.cover.source + ' attending: ' + fbEvent.attending_count));
                $scope.fbEvent = fbEvent;
            },
            function(error) {
                //alert('Facebook error: ' + error.error_description);
            });
    };




// populate thumbnails using fb login
    //$scope.getFbEvent(709839699128487);

//OLD ADD TO FAV
    /*
      if ($scope.sortVal != 'distanceFunc' && $scope.sortVal != 'priceFunc') {
        var keys = $scope.sortVal.replace(/\[(\d+)\]/g,".$1").split('.').slice(1);
                item.json;
                for (i = 0 ; i< keys.length; i++) {
                    var key = keys[i];
                    //console.log(key);
                    if (typeof result[key] !== 'undefined') {
                            result = result[key];
                    } else {
                        result = 0;
                        break;
                    }
                }
            //console.log(result);
            return result;
      } else



        $scope.toggleStar = function(event) {
            event.star = !event.star;

        };

//LOWEST PRICE NOT USED ANYMORE, is PART OF DATABASE!

    $scope.lowestPrice = function(item) {
        if (item.json.prices[0]) {
            lowestPrice = 999999999; // is higher than numbers, and if no tickets won't get replaced.
            for (i = 0; i < item.json.prices.length; i++) {
                ticket = item.json.prices[i];
                if (!ticket.soldOut && ticket.price < lowestPrice) {
                    lowestPrice = ticket.price;
                }
            }
            if (lowestPrice == 999999999) {
                lowestPrice = 'soldout!';
            } else if (lowestPrice === 0) {
                if (item.json.prices.length > 1) {
                    lowestPrice = 'free*';
                } else {
                    lowestPrice = 'free';
                }
            }
            return lowestPrice;
        }

// price sorting, NOT USED
      // if (item.json.prices[0]) {
      //     lowestPrice = 10000; // is higher than numbers, and if no tickets won't get replaced.
      //     for (i = 0; i < item.json.prices.length; i++) {
      //         ticket = item.json.prices[i];
      //         if (!ticket.soldOut && Number(ticket.price) < lowestPrice) {
      //             lowestPrice = ticket.price;
      //         }
      //     }
      //     if (lowestPrice === 0) {
      //         if (item.json.prices.length > 1) {
      //             lowestPrice = 0;
      //         } else {
      //             lowestPrice = -1;
      //         }
      //     }
      //     return lowestPrice;
      // } else {
      //     return $scope.reverse ? -10000000 : 'zzzzzzzz';
      // }
      //
    };
    */
})

.controller('EventDetailCtrl', function($scope, eventdetails, $ionicScrollDelegate) {
    // get event from the promise resolve provided via the EventsSevice by the stateprovider
    $scope.event = eventdetails;

});


// geo location Distance calc functions, should be in a service actually.
function toRad(value) {
    var RADIANT_CONSTANT = 0.0174532925199433;
    return (value * RADIANT_CONSTANT);
}

function calculateDistance(starting, ending) {
    var KM_RATIO = 6371;
    try {
        var dLat = toRad(ending.latitude - starting.latitude);
        var dLon = toRad(ending.longitude - starting.longitude);

        var lat1Rad = toRad(starting.latitude);
        var lat2Rad = toRad(ending.latitude);

        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = KM_RATIO * c;
        ///console.log(d, c);
        d = Math.round(d * 10) / 10;
        return d;
    } catch (e) {
        return -1;
    }
}
