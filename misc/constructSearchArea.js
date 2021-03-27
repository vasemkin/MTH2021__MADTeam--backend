const constructSearchArea = (initialCords, destinationCords) => {

    const left = initialCords.longitude;
    const top = initialCords.latitude;
    const right = destinationCords.longitude;
    const bottom = destinationCords.latitude;

    return (`${left}%2C${top}%2C${right}%2C${bottom}`)

}

module.exports = constructSearchArea;