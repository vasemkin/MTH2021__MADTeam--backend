const axios = require('axios');
const path = require('path');
var appRoot = require('app-root-path');
const readFile = require('../../misc/readFile');
const constructSearchArea = require('../../misc/constructSearchArea');
const User = require("./models.js");

const index = async function (app, db) {

    const config_path = path.join(appRoot.toString(), 'config', 'config.json');

    const config = await readFile(config_path);

    const key = config.mapQuestKey;

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

    app.post('/api/get_places', (req, res) => {

        const initial_cords = {
            latitude: req.body.initial_latitude,
            longitude: req.body.initial_longitude
        };

        const destination_cords = {
            latitude: req.body.destination_latitude,
            longitude: req.body.destination_longitude
        };

        const osm_viewbox = constructSearchArea(initial_cords, destination_cords);

        console.log(osm_viewbox);

        const places_query_route = `http://open.mapquestapi.com/nominatim/v1/search.php?key=${key}&format=json&bounded=1&q=[pub]&viewbox=${osm_viewbox}`;

        axios.get(places_query_route)
            
            .then(response => {

                res.json({
                    resp: response.data
                })


            })
            .catch((error) => {
                console.log(error);
              })

    }); 
      

}

module.exports = index;