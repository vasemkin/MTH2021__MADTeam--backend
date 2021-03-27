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
    const destinations_query_route = `http://open.mapquestapi.com/directions/v2/route?key=${key}`;

    app.get('/api/list_users', (req, res) => {

        User.find({}, function(err, result) {
            if (err) {
              console.log(err);
            } else {
              res.json(result);
            }
          });

    });

    app.post('/api/gen_user', (req, res) => {

        // schema:
        // uuid: string
        // interests: array

        const new_user = new User({
            uuid: req.body.uuid,
            interests: req.body.interests
        });

        new_user.save(function (err) {
            if (err) return ;
            // saved!

            res.json({
                "status" : "ok"
            });

            console.log('added new user');

          });
          

    });

    app.post('/api/redraw_route', (req, res) => {

        const places_arr = req.body.places;

        let locations = [];

        for (place in places_arr) {

            const temp = {
                "latLng" : {
                    "lat" : places_arr[place].latitude,
                    "lng" : places_arr[place].longitude,
                }
            }

            locations.push(temp);
        }

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

        }).then(result => {

            try {

                const new_shapes = genShapes(result.data.route.shape.shapePoints);

                res.json({
                            directions : new_shapes
                        });
                
            } catch (error) {

                console.log(error);
                
            }


        })

    });

    app.post('/api/get_places', (req, res) => {

        //construct viewbox for finding places

        const initial_cords = {
            latitude: req.body.initial_latitude,
            longitude: req.body.initial_longitude
        };

        const destination_cords = {
            latitude: req.body.destination_latitude,
            longitude: req.body.destination_longitude
        };

        const osm_viewbox = constructSearchArea(initial_cords, destination_cords);

        const places_query_route = `http://open.mapquestapi.com/nominatim/v1/search.php?key=${key}&q="[hospital]"&format=json&bounded=1&q=[pub]&viewbox=${osm_viewbox}`;

        axios.get(places_query_route)

            //get the preffered route

            .then(response => {

                const dest_json = {

                    locations: [ {

                        "latLng" : {
                            "lat" : initial_cords.latitude,
                            "lng" : initial_cords.longitude
                        }

                    }, {

                        "latLng" : {
                            "lat" : destination_cords.latitude,
                            "lng" : destination_cords.longitude
                        }

                    }

                    ],

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

                console.log(dest_json);
       

                axios({

                    method: 'post',
                    url: destinations_query_route,
                    data: dest_json

                }).then(dest_res => {

                    //send response

                    try {

                        const shapes_array = genShapes(dest_res.data.route.shape.shapePoints);
    
                        res.json({
                            places: response.data, 
                            directions : shapes_array
                        })
        
                        
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