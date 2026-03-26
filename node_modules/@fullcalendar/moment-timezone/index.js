import { createPlugin } from '@fullcalendar/core/index.js';
import moment from 'moment-timezone';
import { NamedTimeZoneImpl } from '@fullcalendar/core/internal.js';

class MomentNamedTimeZone extends NamedTimeZoneImpl {
    offsetForArray(a) {
        return moment.tz(a, this.timeZoneName).utcOffset();
    }
    timestampToArray(ms) {
        return moment.tz(ms, this.timeZoneName).toArray();
    }
}

var index = createPlugin({
    name: '@fullcalendar/moment-timezone',
    namedTimeZonedImpl: MomentNamedTimeZone,
});

export { index as default };
