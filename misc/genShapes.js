const genShapes = (shapes) => {

    const shapes_array = []

    for (let i = 0; i < shapes.length; i+=2) {

        const temp_obj = {
            'latitude' : shapes[i], 
            'longitude' : shapes[i+1]
        }

        shapes_array.push(temp_obj)

    }

    return shapes_array;

}

module.exports = genShapes;