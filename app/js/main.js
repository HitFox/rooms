var googleCalendarAPI = require('./googleCalendarAPI.js');

var Room = function(data) {
  this.googleCalendarId = m.prop(data.googleCalendarId);
  this.name = m.prop(data.name);
  this.free = m.prop(false);
}

var User = function(data) {
  var data = data || {};
  this.authenticated = m.prop(data.authenticated || false);
}

User.prototype.authenticate = function(user) {
  googleCalendarAPI.checkAuth(function(result) {
    if (result && !result.error) {
      user.authenticated(true);
      User.save(user);
      console.log('apparently authenticated');
    } else {
      console.log('not authenticated');
      user.authenticated(false);
    }
  });
}

User.save = function(user) {
  localStorage["rooms.current-user"] = JSON.stringify(user);
}

User.load = function() {
  try {
    user = JSON.parse(localStorage["rooms.current-user"]);
    return new User({authenticated: user.authenticated});
  } catch(err) {
    return false;
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
    var user = User.load() || new User();
    var userAuthenticated = user.authenticated();

    return {user: user, userAuthenticated: userAuthenticated}
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
