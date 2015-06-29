angular.module('ionicApp.services', [])

/*FILTERS*/

.filter('escape', function(text) {
  if (text) {
    return text.
        replace(/&/g, '&amp;').
        replace(/</g, '&lt;').
        replace(/>/g, '&gt;');
  }
  return '';
})
.filter('rangeFilter', function() {
    return function( items, dateRange ) {
        var filtered = [];
        var min = dateRange.dateMin ? dateRange.dateMin : new Date("1970-12-31T23:00:00.000Z");
        var max = dateRange.dateMax ? dateRange.dateMax : new Date("2500-12-30T23:00:00.000Z");

        // If time is with the range
        angular.forEach(items, function(item) {
        // Should prob. put this in the json, NewDate perforamnce?
        if(item.json) {
            var eventDate = (!item.json.endDate || item.json.endDate === undefined) ? new Date(item.json.startDate) : new Date(item.json.endDate);
            if( eventDate >= min && eventDate <= max ) {
                filtered.push(item);
            }
        }

        });
        return filtered;
    };
})
.filter('hasProperty', function() {
  return function(items,property) {
    var filtered = [];
    angular.forEach(items, function(item) {
        if (item.property === true){
            filtered.push(item);
        }
    });
  };
})

/*DIRECTIVES*/

.directive('slideAlong', function($timeout, $ionicSideMenuDelegate) {
    return  {
        link: function($scope, $element, $attrs) {
            $scope.$watch(function() {
                return $ionicSideMenuDelegate.getOpenRatio();
            }, function(ratio) {

                // retrieve the offset value from the offset attribute
                var offset = parseInt($attrs.offset);
                // set the new position
                var position = $attrs.side == 'left' ? (ratio * (offset * -1)) + (offset) : (ratio * (offset * -1) - offset);

                // we want to set the transition to 500ms (arbitrary) when
                // clicking/tapping and 0ms when swiping
                $element[0].style.webkitTransition = (ratio === 0 || ratio === 1 || ratio === -1) ? '500ms' : '0ms';

                // we set the offset according to the current ratio
                $element[0].style.webkitTransform = 'translate3d(' + position + '%, 0, 0)';

            });
        }
    };
})

/*FACTORIES*/

.factory('GetPouchDocs', ['$rootScope', function($rootScope) {

    // init variables docs, contains pouch docs, db = db reference
    var docs;
    var db = localDB;

    // return functions, so these can be called by the controllers and so their promises can be returned.
    return {
         fetchInitialDocs: function() {
          return db.allDocs({include_docs: true}).then(function (res) {
            docs = res.rows.map(function (row) { return row.doc; });
            renderDocs();
          });
        },

         reactToChanges: function() {
            //console.log($scope.events);
          db.changes({live: true, since: 'now', include_docs: true}).on('change', function (change) {
            if (change.deleted) {
              // change.id holds the deleted id
              onDeleted(change.id);

              // to broadcast an event to the controller use:  $rootScope.$broadcast('delete', change.id);

            } else { // updated/inserted
              // change.doc holds the new doc
              onUpdatedOrInserted(change.doc);
            }
            renderDocs();
          }).on('error', console.log.bind(console));
        }
    };

    // $rootScope.$apply, to get the factory data to apply to the scope of the calling controller (is that how is works?)
    function renderDocs() {
        //var docs = ;
        $rootScope.$apply(function() {
            $rootScope.events = docs;
        });
    }

    // Helper Functions for maintaining sorting throughout operations, minimizing DOM redraws per update.
    function binarySearch(arr, docId) {
      var low = 0, high = arr.length, mid;
      while (low < high) {
        mid = (low + high) >>> 1; // faster version of Math.floor((low + high) / 2)
        if(arr[mid]._id < docId) {low = mid + 1;} else {high = mid;}
      }
      return low;
    }

    function onDeleted(id) {
        var index = binarySearch(docs, id);
        var doc = docs[index];
        if (doc && doc._id === id) {
           docs.splice(index, 1);
        }
    }

    function onUpdatedOrInserted(newDoc) {
        var index = binarySearch(docs, newDoc._id);
        var doc = docs[index];
        if (doc && doc._id === newDoc._id) { // update
            docs[index] = newDoc;
        } else { // insert
            docs.splice(index, 0, newDoc);
        }
    }
}])

// some test for returning just One event


.service('EventsService', function($q) {
    return {
        getEvents: function() {
            return $rootScope.events;
        },
        getEvent: function(evId) {
            var dfd = $q.defer();
            $rootScope.events.forEach(function(event) {
                if (event.id === evId) dfd.resolve(event);
            });
            return dfd.promise;
        }
    };
})


//UNNEEDED>>>
//
//
//
.factory('PouchDBListener', ['$rootScope', function($rootScope) {

        //Old PouchListener Service, which broadcasts events to the controller, but does not allow for promises,
        //so DB population is done from scratch every time,
        // this approach also has some flaws, because every update causes a complete DOM redraw, and sorting is not maintained.
        // unless the event listeners have some logic for this.

/*
    localDB.changes({
        continuous: true,
        include_docs: true,
        onChange: function(change) {
            if(!$rootScope.fetchAlldone){
                if (!change.deleted) {
                    $rootScope.$apply(function() {
                        localDB.get(change.id, function(err, doc) {
                            $rootScope.$apply(function() {
                                if (err) console.log(err);
                                $rootScope.$broadcast('add', doc);
                            });
                        });
                    });
                } else {
                    $rootScope.$apply(function() {
                        $rootScope.$broadcast('delete', change.id);
                    });
                }
            }

        }
    });*/
    return true;
}])



.factory('Events', ['$http',function($http){
   return {
       all: function(callback){
            $http.get(
                'js/libs/parties.xml',
                {transformResponse:function(data) {
                  // convert the data to JSON and provide
                  // it to the success function below
                    var x2js = new X2JS();
                    var json = x2js.xml_str2json( data );
                    return json;
                    }
                }
            ).
            success(function(data, status) {
                // send the converted data back
                // to the callback function
                callback(data);
            });
       }
   };
}])
.factory('EventDetails', ['$http',function($http){
    return {
       all: function(callback){
            $http.get(
                'js/libs/kimonoData.json',
                {transformResponse:function(data) {
                  // convert the data to JSON and provide
                  // it to the success function below
                    var EventDetailsJson = transform(data);
                    return EventDetailsJson;
                    }
                }
            ).
            success(function(data, status) {
                // send the converted data back
                // to the callback function
                callback(data);
            });
       }
   };
}]);


/*
function transform(data) {
    var then = new Date().getTime();
    jsonObj = JSON.parse(data);
    var newData = {
        "events": []
    };
    count = 0;
    // keep list of event id's to group duplicate event entries
    var idlist = [];

    for (var i = 0; i < jsonObj.results.pf_price.length; i++) {
        if (jsonObj.results.pf_price[i].url) {
            //console.log(jsonObj.results.pf_price[i].url)
            count++;
            //get id_nrs
            idname = jsonObj.results.pf_price[i].url.replace(/.+\/(\d+):.+/, '$1') + '';
            // check id list for duplicates
            index = idlist.indexOf(idname);
            if (index < 0) {
                idlist.push(idname);
                //add price data
                newData.events.push({
                    'id': idname,
                    'url': jsonObj.results.pf_price[i].url,
                    prices: [{
                        type: jsonObj.results.pf_price[i].ticket_type,
                        price: jsonObj.results.pf_price[i].price,
                        soldOut: 'maybe'
                    }]
                });
            } else {
                // event exists so add pricedata to that event
                newData.events[index].prices.push({
                    type: jsonObj.results.pf_price[i].ticket_type,
                    price: jsonObj.results.pf_price[i].price,
                    soldOut: 'unknown'
                });
            }
        }
    }

    // Add genres/styles
    count2 = 0;
    genre_index = 0;

    idlist2 = [];

    for (i = 0; i < jsonObj.results.pf_styles.length; i++) {

        genre_text = jsonObj.results.pf_styles[i].styles.text;

        if (genre_text == 'Genres' || genre_text == 'Genres (schatting)') {
            //new event, reset genre count
            genre_index = -1;
            weight = 1;
        } else if (genre_text !== undefined && genre_text != ' ' && genre_text.length < 30) {
            count2++;
            //get id_nrs
            idname = jsonObj.results.pf_styles[i].url.replace(/.+\/(\d+):.+/, '$1') + '';
            // check first id list for duplicates
            index = idlist.indexOf(idname);
            //check for genre weight
            //console.log(genre_text)
            if (genre_text && genre_text.indexOf('× ') === 0 && index >= 0) {
                //console.log(genre_text.indexOf('× ') + ' ' + genre_index + ' - ' + JSON.stringify(newData.events[index].styles[0].weight) )
                // update weights end continue (can go first because weighs always come after genre)
                newData.events[index].styles[genre_index].weight = genre_text.replace(/.*(\d+)/, '$1');
                continue;
            } else {
                //weight not added so next genre
                genre_index += 1;
            }
            if (index < 0) {
                //missing event (so add it with just the id, url and genre info)
                idlist.push(idname);
                //add unknown price data
                newData.events.push({
                    'id': idname,
                    'url': jsonObj.results.pf_styles[i].url,
                    prices: [{
                        type: '',
                        price: 'unknown',
                        soldOut: ''
                    }],
                    //add first genre data
                    styles: [{
                        type: jsonObj.results.pf_styles[i].styles.text,
                        weight: '1'
                    }]
                });
                //sanity check
                //index = idlist.indexOf(idname);
                //console.log(genre_text+' '+genre_text.indexOf('× ') + ' ' + genre_index + ' - ' + JSON.stringify(newData.events[index].styles) )
            } else {
                //check for genre array to push or else create one
                if (newData.events[index].styles) {
                    newData.events[index].styles.push({
                        type: jsonObj.results.pf_styles[i].styles.text,
                        weight: '1'
                    });
                } else {
                    newData.events[index].styles = [{
                        type: jsonObj.results.pf_styles[i].styles.text,
                        weight: '1'
                    }];
                }
                // event exists so add pricedata to that event
            }
        }
    }
    //console.log(count2);
    // Add ticketsale and facbook page
    // add pf_ticket+fb_link

    count3 = 0;
    for (i = 0; i < jsonObj.results['pf_ticket+fb_link'].length; i++) {
        //get id_nrs
        idname = jsonObj.results['pf_ticket+fb_link'][i].url.replace(/.+\/(\d+):.+/, "$1");
        // check id list for duplicates
        index = idlist.indexOf(idname);
        ticket_text = jsonObj.results['pf_ticket+fb_link'][i].tickets.text;
        ticket_url = false;

        //skip booking.com
        if(ticket_text && ticket_text != "Booking.com" && ticket_text != " ") {
            ticket_url = jsonObj.results['pf_ticket+fb_link'][i].tickets.href;
        }
        // get facebooklink
        if (jsonObj.results['pf_ticket+fb_link'][i].facebook) {
            facebook_text = jsonObj.results['pf_ticket+fb_link'][i].facebook.title;
            facebook_eventid = false;
            //console.log(jsonObj.results['pf_ticket+fb_link'][i].facebook)
            //check for event url
            if (facebook_text && facebook_text.indexOf('facebook.com/events') > -1) {
                facebook_eventid = facebook_text.replace(/.*facebook.com\/events\/(\d+).*//*, '$1');
            }}

        //check for sold out status
        soldout_state = 0;
        if (jsonObj.results['pf_ticket+fb_link'][i].soldoutstate && jsonObj.results['pf_ticket+fb_link'][i].soldoutstate.indexOf('itverkocht') > -1) {
            soldout_state = 1;
        }

        if (index < 0) {
            //missing event (so create new Object based on what is available here)
            pushObj = "{ \"id\" : " + idname + ", \"url\" : \"" + jsonObj.results['pf_ticket+fb_link'][i].url + "\"";
            if (facebook_eventid) {
                pushObj += ", \"facebookId\" :\"" + facebook_eventid+ "\"";
            }
            if (soldout_state) {
                pushObj += ", \"prices\" : [{ \"soldOut\" : \"" + soldout_state + "\"}]";
            }
            if (ticket_url) {
                pushObj += " , \"tickets\" : [{ \"ticketUrl\" : \"" + ticket_url + "\", \"ticketSeller\" : \"" + ticket_text + "\" }]";
            }
            pushObj += "}";

            pushObj = JSON.parse(pushObj);
            //console.log(pushObj);
            idlist.push(idname);
            //add unknown price data
            newData.events.push(pushObj);
            //sanity check
            //index = idlist.indexOf(idname);
            //console.log(genre_text+' '+genre_text.indexOf('× ') + ' ' + genre_index + ' - ' + JSON.stringify(newData.events[index].styles) )
        } else {
            //add facebook ID
            if (facebook_eventid) {
                newData.events[index].facebookId = facebook_eventid;
            }
            //  add soldout
            if (soldout_state) {
                newData.events[index].prices[0].soldOut = soldout_state;
            }
            //check for ticket array to push or else create one
            if (ticket_url) {
                if (newData.events[index].tickets) {
                    newData.events[index].tickets.push({
                        ticketUrl: ticket_url,
                        ticketSeller: ticket_text
                    });
                } else {
                    newData.events[index].tickets = [{
                        ticketUrl: ticket_url,
                        ticketSeller: ticket_text
                    }];
                }
            }
        }
        count3++;
    }

    var now = new Date().getTime();
    console.log(' parsing ended, ' + (count + count2 + count3) + ' objects were parsed into ' + newData.events.length + ' events, it took ' + (now - then) + ' ms.');
return newData;
}
*/
