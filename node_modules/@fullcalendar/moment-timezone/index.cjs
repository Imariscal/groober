'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var index_cjs = require('@fullcalendar/core/index.cjs');
var moment = require('moment-timezone');
var internal_cjs = require('@fullcalendar/core/internal.cjs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var moment__default = /*#__PURE__*/_interopDefaultLegacy(moment);

class MomentNamedTimeZone extends internal_cjs.NamedTimeZoneImpl {
    offsetForArray(a) {
        return moment__default["default"].tz(a, this.timeZoneName).utcOffset();
    }
    timestampToArray(ms) {
        return moment__default["default"].tz(ms, this.timeZoneName).toArray();
    }
}

var index = index_cjs.createPlugin({
    name: '@fullcalendar/moment-timezone',
    namedTimeZonedImpl: MomentNamedTimeZone,
});

exports["default"] = index;
