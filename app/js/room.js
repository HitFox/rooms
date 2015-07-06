var room = {};

room.Room = function(data) {
  this.googleCalendarId = m.prop(data.googleCalendarId);
  this.free = m.prop(false);
}
