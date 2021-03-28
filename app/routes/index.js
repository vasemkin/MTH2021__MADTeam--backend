const axios = require('axios');
const path = require('path');
var appRoot = require('app-root-path');
const readFile = require('../../misc/readFile');
const constructSearchArea = require('../../misc/constructSearchArea');
const genShapes = require('../../misc/genShapes');
const User = require("./models.js");

const index = async function (app, db) {

    const config_path = path.join(appRoot.toString(), 'config', 'config.json');
    const config = await readFile(config_path);
    const key = config.mapQuestKey;
    const destinations_query_route = `http://open.mapquestapi.com/directions/v2/optimizedroute?key=${key}`;

    app.get('/api/list_users', (req, res) => {

    // a debug endpoint

        User.find({ "uuid" : "admin" }, function(err, result) {
            if (err) {

              console.log(err);

            } else {

              res.json(result);

            }
          });

    });

    app.post('/api/save_route', (req, res) => {

        const uuid = req.body.uuid;
        const route = req.body.route;

        //route schema

        // {
        //     "name" : "my awesome route",
        //     "route_id" : "xxxxxxx"
        //     "type" : "route || activity",
        //     "due_time" : "10.10.2010 10:10" (better as unix time)
        //     "points" : array
        //     "markers" : [
        //          {
        //              "latitude" : "val",
        //              "longitude" : "val",
        //              "title" : "str",
        //          }
        //      ]
        // }

        User.find({ "uuid" : uuid }, async function(err, result) {

            try {

                result[0].routes.push(route);
                await result[0].save();
    
                res.json({
                    "status" : "ok"
                });
    
                
            } catch (error) {

                res.json({
                    "status" : "error",
                    "message" : error.message
                });
                
            }
        })

    })

    app.post('/api/remove_route', (req, res) => {

        const uuid = req.body.uuid;
        const route_id = req.body.route_id;

        User.find({ "uuid" : uuid }, function(err, result) {

            try {

                const routes = result[0].routes;

                routes.forEach(async route => {

                    if (route.route_id === route_id) {

                        const index = routes.indexOf(route);
                        index > -1 ? routes.splice(index, 1) : null;
                        await result[0].save();

                        res.json({
                            "status" : "ok"
                        });
            

                    }

                });
    
                
            } catch (error) {

                res.json({
                    "status" : "error",
                    "message" : error.message
                });
                
            }
        })

    })

    app.get('/api/get_route', (req, res) => {

        const uuid = req.headers.uuid;

        User.find({ "uuid" : uuid }, function(err, result) {

            try {

                const routes = result[0].routes;

                res.json({
                    "routes" : routes,
                })
    
                
            } catch (error) {

                res.json({
                    "status" : "error",
                    "message" : error.message
                });
                
            }
        })

    })

    app.post('/api/gen_user', (req, res) => {

        // schema:
        // uuid: string
        // routes: array

        const new_user = new User({
            uuid: req.body.uuid,
            routes: req.body.routes
        });

        new_user.save(function (err) {
            if (err) return ;
            // saved!

            res.json({
                "status" : "ok"
            });

          });
          

    });


    app.post('/api/get_places', (req, res) => {

        //construct viewbox for finding places

        const places_arr = req.body.places;
        const place_type = req.body.type || 'pubs';

        let locations = [];

        for (let place in places_arr) {

            const temp = {
                "latLng" : {
                    "lat" : places_arr[place].latitude,
                    "lng" : places_arr[place].longitude,
                }
            }

            locations.push(temp); 

        }

        const initial_cords = {
            latitude: locations[0].latLng.lat,
            longitude: locations[0].latLng.lng
        };

        const destination_cords = {
            latitude: locations[locations.length - 1].latLng.lat,
            longitude: locations[locations.length - 1].latLng.lng
        };

        const osm_viewbox = constructSearchArea(initial_cords, destination_cords);

        const places_query_route = `http://open.mapquestapi.com/nominatim/v1/search.php?key=${key}&q=[${place_type}]&format=json&bounded=1&viewbox=${osm_viewbox}`;

        axios.get(places_query_route)

            //get the preffered route

            .then(response => {

                const redraw_route_query = {

                    locations: locations,

                    options: {
                        avoids: [],
                        avoidTimedConditions: false,
                        doReverseGeocode: true,
                        shapeFormat: 'raw',
                        generalize: 0,
                        routeType: 'pedestrian',
                        timeType: 1,
                        locale: 'ru_RU',
                        unit: 'm',
                        enhancedNarrative: false,
                    }

                }

                axios({

                    method: 'post',
                    url: destinations_query_route,
                    data: redraw_route_query

                }).then(dest_res => {


                    try {

                        const shapes_array = genShapes(dest_res.data.route.shape.shapePoints);
    
                        res.json({
                            names: dest_res.data.route.locations,
                            places: response.data, 
                            directions : shapes_array
                        })

                        console.log({
                            names: dest_res.data.route.locations,
                            places: response.data, 
                            directions : shapes_array
                        });
                        
                    } catch (error) {
                        
                        console.log(error);
                        
                        res.json({
                            'status' : 'error'
                        })

                    }

                });


                

            })
            .catch((error) => {
                console.log(error);
              })

    }); 
      

}

module.exports = index;