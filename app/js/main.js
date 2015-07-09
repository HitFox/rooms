var googleCalendarAPI = require('./googleCalendarAPI.js');

var Room = function(data) {
  this.googleCalendarId = m.prop(data.googleCalendarId);
  this.name = m.prop(data.name);
  this.free = m.prop(false);
}

var User = function(data) {
  this.authenticated = m.prop(false);
}

User.prototype.authenticate = function(user) {
  googleCalendarAPI.checkAuth(function(result) {
    if (result && !result.error) {
      user.authenticated(true);
      console.log('apparently authenticated');
    } else {
      console.log('not authenticated');
      user.authenticated(false);
    }
  });
}

Room.all = function() {
  var calendars = [];
  for (var name in googleCalendarAPI.calendars) {
    var room = new Room({googleCalendarId: googleCalendarAPI.calendars[name], name: name});
    calendars.push(room);
  }
  return calendars;
}

var MainApp = {
  controller: function() {
    var user = new User();
    self.userAuthenticated = user.authenticated();
    return {user: user}
  },

  view: function(ctrl) {
    return m("div", {class: "app-container"}, [
      ctrl.userAuthenticated ? m.component(RoomList) : m.component(Login, {user: ctrl.user})
    ])
  }
}

var Login = {
  view: function(ctrl, data) {
    return m("div", {id: "login"}, [
      m("button", {onclick: data.user.authenticate.bind(this, data.user)}, "Login with Google")
    ])
  }
}

var RoomList = {
  controller: function() {
    return {rooms: Room.all()}
  },

  view: function(ctrl) {
    return m("ul", {class: "rooms"}, [
      ctrl.rooms.map(function(room){
        return m.component(RoomElement, {room: room})
      })
    ])
  }
}

var RoomElement = {
  isRoomAvailableClass: function(room) {
    return room.free() ? 'available' : 'not-available'
  },

  view: function(ctrl, data) {
    var room = data.room;
    return m("li", {class: "room " + this.isRoomAvailableClass(room)}, room.name())
  }
}

m.mount(document.body, MainApp);
