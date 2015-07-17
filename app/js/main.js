var googleCalendarAPI = require('./googleCalendarAPI.js');

var Room = function(data) {
  this.googleCalendarId = m.prop(data.googleCalendarId);
  this.name = m.prop(data.name);
  this.free = m.prop(data.free);
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
      m.redraw();
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

Room.all = function(callback) {
  googleCalendarAPI.getCalendars(function(err, calendars) {
    if (err) {
      console.log('ERROR', err);
      callback(err);
    } else {
      var rooms = [];
      for (var name in calendars) {
        var room = new Room({googleCalendarId: calendars[name][0], name: name, free: calendars[name][1]});
        rooms.push(room);
      }
      callback(null, rooms);
    }
  });
}

var MainApp = {
  controller: function() {
    var user = User.load() || new User();

    return {user: user}
  },

  view: function(ctrl) {
    return m("div", {class: "app-container"}, [
      ctrl.user.authenticated() ? m.component(RoomList) : m.component(Login, {user: ctrl.user})
    ])
  }
}

var Login = {
  view: function(ctrl, data) {
    return m("div", {id: "login"}, [
      m("img", {src: "/app/img/couch.svg"}),
      m("button", {onclick: data.user.authenticate.bind(this, data.user)}, "Login with Google")
    ])
  }
}

var rooms = [];

var RoomList = {
  controller: function() {
    if (!rooms.length) {
      Room.all(function(err, rs) {
        rooms = rs
        m.redraw.strategy('all');
        m.redraw();
      })
    }
    return {rooms: rooms}
  },

  view: function(ctrl) {
    return m("ul", {class: "rooms"}, [
      ctrl.rooms.map(function(room) {
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
