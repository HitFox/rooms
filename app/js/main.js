var room = {};

var Room = function(data) {
  this.googleCalendarId = m.prop(data.googleCalendarId);
  this.free = m.prop(false);
}

var Login = {
  controller: function() {}

  view: function() {
    return m("div", "Please log in below")
  }
}
