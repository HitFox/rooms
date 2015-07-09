var googleCalendarAPI = require('./googleCalendarAPI.js');

var Room = function(data) {
  this.googleCalendarId = m.prop(data.googleCalendarId);
  this.name = m.prop(data.name);
  this.free = m.prop(false);
}

var User = function(data) {
  this.authenticated = m.prop(false);
}

User.authenticate = function() {
  if (googleCalendarAPI.checkAuth()) {
    User.authenticated(true);
  } else {
    User.authenticated(false);
  }
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
    var self = this;
    self.userAuthenticated = User.authenticated;
  },

  view: function(ctrl) {
    return m("div", {class: "app-container"}, [
      ctrl.userAuthenticated ? m.component(RoomList) : m.component(Login)
    ])
  }
}

var Login = {
  handleLogin: function() {
    return User.authenticate
  },

  view: function() {
    return m("div", {id: "login"}, [
      m("button", {onclick: this.handleLogin(), id: "login-button"}, "Login")
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
