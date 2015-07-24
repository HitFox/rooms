var CLIENT_ID = '1068348292557-n3mb1rgigec0o87nhdpqlab4bolvlkbs.apps.googleusercontent.com';

var SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

module.exports.checkAuth = function checkAuth(callback) {
  gapi.auth.authorize(
    {
      'client_id': CLIENT_ID,
      'scope': SCOPES,
      'immediate': true
    }, callback);
}

module.exports.setToken = function setToken(token) {
  gapi.auth.setToken(token);
}

module.exports.getCalendars = function loadCalendarApi(callback) {
  gapi.client.load('calendar', 'v3', showFreebusyInformation.bind(this, callback));
}

var calendars = module.exports.calendars = {
  'Sao Paulo': 'hitfox.com_3535303939343431373033@resource.calendar.google.com',
  'Moscow': 'hitfox.com_2d3938313939343735383136@resource.calendar.google.com',
  'Seoul': 'hitfox.com_32343038303334322d393836@resource.calendar.google.com',
  'Berlin': 'hitfox.com_3832383536343230323234@resource.calendar.google.com',
  'Zurich': 'hitfox.com_37313339353738362d323839@resource.calendar.google.com',
  'Paris': 'hitfox.com_333139373337302d393030@resource.calendar.google.com',
  'Dheli': 'hitfox.com_39353631383334352d373837@resource.calendar.google.com'
}

function getCalendarName(id) {
  for(var prop in calendars) {
    if(calendars.hasOwnProperty(prop)) {
      if(calendars[ prop ] === id)
        return prop;
    }
  }
}

function freeOrBusy(calendar) {
  return calendar.busy
  // if (calendar.busy.length === 0) {
  //   return true;
  // } else {
  //   return false;
  // }
}

function calendarsForFreebusy() {
  calendarArray = new Array();
  for (var id in calendars) {
    var calendar = new Object();
    calendar.id = calendars[id];
    calendarArray.push(calendar);
  }
  return calendarArray
}

function showFreebusyInformation(callback) {
  var request = gapi.client.calendar.freebusy.query({
    resource: {
      timeMin: new Date(Date.now()).toISOString(),
      timeMax: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      timeZone: 'Europe/Berlin',
      items: calendarsForFreebusy()
    }
  });

  request.execute(function(resp) {
    var calendars = resp.calendars;

    if (calendars) {
      console.log('Success');
      var calendarsFreeBusyInfo = new Object();
      console.log(calendars);
      for (var calendarId in calendars) {
        var name = getCalendarName(calendarId);
        var ary = freeOrBusy(calendars[calendarId]);
        calendarsFreeBusyInfo[name] = [calendarId, ary];

      }
      callback(null, calendarsFreeBusyInfo);
    } else {
      console.log('Something went wrong');
    }
  });
}



