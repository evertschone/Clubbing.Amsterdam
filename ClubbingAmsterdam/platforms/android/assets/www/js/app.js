//angular.module('ionicApp', ['ionic'])

// setup DB connections
// bootstrap Ionic only after loading the platform
window.ionic.Platform.ready(function() {
    window.setTimeout(function(){
    angular.bootstrap(document, ['ionicApp']);
    }, 0);
});

var localDB = new PouchDB("juli_12_db_local_2");
var userDB = new PouchDB("user_db_big");

//var remoteDB = new PouchDB("https://couchdb-6fd6db.smileupps.com/events_db");
//var remoteDB = new PouchDB("http://localhost:5984/juli_12_db");
//var remoteDB = new PouchDB("http://192.168.43.95:5984/events_db_bigthumb");
var remoteDB = new PouchDB("http://192.168.173.2:5984/juli_12_db");


// device APIs are available
var watchID = null;

angular.module('ionicApp', ['ionic', 'ionicApp.controllers', 'ionicApp.services', 'ngOpenFB'])

.run(function($ionicPlatform, ngFB) {
    // inits facebook API with appID (dependancies are declared above)
    ngFB.init({appId: '492752134210657'});
    localDB.replicate.from(remoteDB, { live: true,  retry: true});
    //remoteDB.sync(localDB, {live: true, retry: true});
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
        // high perf
        //ionic.Platform.setGrade('c');

        //get position.
        //navigator.geolocation.getCurrentPosition(onSuccess, onError);
        //watchLocation();
  });
})

.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state('eventmenu', {
            url: "/events",
            abstract: true,
            templateUrl: "templates/menu_container.html",
            controller: "ListCtrl"
        })
        .state('eventmenu.events', {
            url: "/eventlist",
            views: {
                'menuContent': {
                    templateUrl: "templates/events_list.html",
                    controller: "ListCtrl"
                }
            }
        })
        .state('eventmenu.event', {
            url: "/:evId",
            views: {
                'menuContent': {
                    templateUrl: "templates/event_detail.html",
                    controller: "EventDetailCtrl",
                    resolve: {
                        eventdetails: function($stateParams, EventsService) {
                            return EventsService.getEvent($stateParams.evId);
                        }
                    }
                }
            }
        })
        .state('eventmenu.home', {
            url: "",
            views: {
                'menuContent': {
                    templateUrl: "templates/home.html",
                    controller: "ListCtrl"
                }
            }
        });
    $urlRouterProvider.otherwise("events");
});
