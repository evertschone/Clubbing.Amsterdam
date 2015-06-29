//angular.module('ionicApp', ['ionic'])

// setup DB connections
// bootstrap Ionic only after loading the platform
window.ionic.Platform.ready(function() {
    window.setTimeout(function(){
    angular.bootstrap(document, ['ionicApp']);
    }, 0);
});

var localDB = new PouchDB("events_db");
var remoteDB = new PouchDB("http://192.168.173.1:5984/events_db");

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
  });
})

.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state('eventmenu', {
            url: "/app",
            abstract: true,
            templateUrl: "templates/event-menu.html",
            controller: "ListCtrl"
        })
        .state('eventmenu.home', {
            url: "/home",
            views: {
                'menuContent': {
                    templateUrl: "templates/home.html",
                    controller: "ListCtrl"
                },
            resolve: {
                events: function(TodosService) {
                    return EventsService.getEvents();
                    }
                }
            }
        })
        .state('eventmenu.event', {
            url: "/event/:evId",
            views: {
                'menuContent': {
                    templateUrl: "templates/eventdetail.html",
                    controller: "ListCtrl"
                },
                resolve: {
                    event: function($stateParams, TodosService) {
                        return EventsService.getEvent($stateParams.evId);
                    }
                }
            }
        });


    $urlRouterProvider.otherwise("/app/home");
});
