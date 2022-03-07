import axios from 'axios';
import X2JS from 'x2js';
import qs from 'qs';


export const URL = (
  process.env.NEXTBUS_XML_FEED_OVERRIDE_URL ||
  'http://retro.umoiq.com/service/publicXMLFeed'
);

export const getUserPosition = options => (
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  })
);

export default class NextBus {
  static async getPredictions(routeStopTags) {
    const response = await axios.get(URL, {
      params: {
        command: 'predictionsForMultiStops',
        a: 'sf-muni',
        stops: routeStopTags,
        useShortTitles: true,
      },
      paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' }),
    });

    const data = this.parsePredictionsXMLResponse(response.data);

    return new Promise((resolve, reject) => {
      const errorText = data?.body?.Error?.__text;
      if (errorText) { reject(new Error(errorText)); }

      resolve(data);
    });
  }

  static async getRouteConfig() {
    const response = await axios.get(URL, {
      params: {
        command: 'routeConfig',
        a: 'sf-muni',
        useShortTitles: true,
      },
    });

    const data = this.parseRouteConfigXMLResponse(response.data);

    return new Promise((resolve, reject) => {
      const errorText = data?.body?.Error?.__text;
      if (errorText) { reject(new Error(errorText)); }

      resolve(this.mergeRouteData(data.body.route));
    });
  }

  static async getStopsNearMe(meters) {
    const responses = await axios.all([
      getUserPosition(),
      this.getRouteConfig(),
    ]);

    const [geoLocation, routeConfig] = responses;

    const currPosition = new google.maps.LatLng(
      geoLocation.coords.latitude,
      geoLocation.coords.longitude,
    );

    const stopResults = [];
    routeConfig.forEach(route => {
      route.direction.forEach(direction => {
        direction.stop.forEach(stop => {
          // Find stops that are within [meters] of the users position
          const stopLatLng = new google.maps.LatLng(stop._lat, stop._lon);
          const distance = google.maps.geometry.spherical
            .computeDistanceBetween(currPosition, stopLatLng);

          if (distance <= meters) {
            stopResults.push({
              tag: route._tag,
              title: route._title,

              directionName: direction._name,
              directionTitle: direction._title,

              latLng: stopLatLng,

              stopId: stop._stopId,
              stopTag: stop._tag,
              stopTitle: stop._title,
            });
          }
        });
      });
    });

    return stopResults;
  }

  static mergeRouteData = routeData => {
    // The purpose of this fn is to merge stop data into direction data. this is necessary because
    // the stops are direction unaware (inbound/outbound):
    //
    // routeData[0].direction[0].stop[0] = {
    //   _tag: "6932"
    // }
    //
    // becomes
    //
    // routeData[0].direction[0].stop[0] = {
    //   _tag: "6932", _lat: "37.123", _stopId: "12789", _title: "Mission"
    // }

    routeData.forEach(route => {
      // map the stop tags
      const stopTags = {};
      route.stop.forEach(stop => {
        stopTags[stop._tag] = stop;
      });

      // there should be only 2 directions. inbound/outbound
      route.direction.forEach(direction => {
        direction.stop.forEach((stop, idx) => {
          // replace the object with the one that has the full data
          direction.stop[idx] = stopTags[stop._tag];
        });
      });
    });
    return routeData;
  }

  static async isValidStop(routeStopTag) {
    try {
      const response = await this.getPredictions([routeStopTag]);
      return !!response?.body?.predictions;
    } catch (e) {
      return false;
    }
  }

  static parsePredictionsXMLResponse(xmlString) {
    return new X2JS({
      arrayAccessFormPaths: [
        'body.predictions',
        'body.predictions.direction.prediction',
      ],
    }).xml2js(xmlString);
  }

  static parseRouteConfigXMLResponse(xmlString) {
    return new X2JS({
      arrayAccessFormPaths: [
        'body.route',
      ],
    }).xml2js(xmlString);
  }

  static getRouteStopTag(routeTag, stopTag) {
    return `${routeTag}|${stopTag}`;
  }

  static splitRouteStopTag(routeStopTag) {
    return routeStopTag.split('|');
  }
}
