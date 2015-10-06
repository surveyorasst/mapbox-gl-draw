'use strict';

import hat from 'hat';
import Immutable from 'immutable';
import { translate } from '../util';
import { LngLat, LngLatBounds } from 'mapbox-gl';
import extent from 'turf-extent';

/**
 * Base Geometry class from which other geometries inherit
 *
 * @param {Object} map - Instance of MapboxGL Map
 * @param {String} type - Type of GeoJSON geometry
 * @param {Object} [data] - GeoJSON feature
 * @returns {Geometry} this
 * @private
 */
export default class Geometry {

  constructor(map, type, data) {
    this._map = map;
    this.drawId = hat();
    this.coordinates = data.geometry.coordinates;
    var props = data.properties || {};
    props.drawId = this.drawId;

    this.geojson = {
      type: 'Feature',
      properties: props,
      geometry: {
        type: type,
        coordinates: this.coordinates.toJS()
      }
    };
  }

  /**
   * @return {Object} GeoJSON feature
   * @private
   */
  toGeoJSON() {
    this.geojson.geometry.coordinates = this.coordinates.toJS();
    return this.geojson;
  }

  /**
   * @returns Draw type
   * @private
   */
  getType() {
    return this.type;
  }

  /*
   * @returns GeoJSON type
   * @private
   */
  getGeoJSONType() {
    return this.geojson.geometry.type;
  }

  setCoordinates(coords) {
    this.coordinates = Immutable.List(coords);
    return this;
  }

  setProperties(props) {
    props.drawId = this.drawId;
    this.geojson.properties = props;
    return this;
  }

  /**
   * Called after a draw is done
   * @private
   */
  _finishDrawing(type) {
    //this._map.fire('finish.edit');
    this._map.fire('drawing.end', {
      geometry: this,
      featureType: type
    });
  }

  /**
   * Clear the edit drawings and render the changes to the main draw layer
   */
  //completeEdit() {
  //  this._map.fire('edit.end', { geometry: this });
  //}

  /**
   * Translate this polygon
   *
   * @param {Array<Number>} init - Mouse position at the beginining of the drag
   * @param {Array<Number>} curr - Current mouse position
   */
  translate(init, curr) {
    if (!this.translating) {
      this.translating = true;
      this.initGeom = JSON.parse(JSON.stringify(this.toGeoJSON()));
    }

    var translatedGeom = translate(JSON.parse(
          JSON.stringify(this.initGeom)), init, curr, this._map);
    this.coordinates = Immutable.List(translatedGeom.geometry.coordinates);
    if (this.coordinates.get(0).length > 1) {
      // you should be ashamed of yourself
      this.coordinates = this.coordinates.set(
          0, Immutable.List(this.coordinates.get(0)));
    }

    this._map.fire('new.edit');
  }

  getExtent() {
    var ext = extent(this.toGeoJSON());
    return new LngLatBounds(
      new LngLat(ext[0], ext[1]),
      new LngLat(ext[2], ext[3])
    );
  }

  _renderDrawProgress() {
    this._map.fire('new.drawing.update', {
      geojson: this.toGeoJSON()
    });
  }

}
