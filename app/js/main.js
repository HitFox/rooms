var googleCalendarAPI = require('./googleCalendarAPI.js');

var rooms = [];

var Room = function(data) {
  this.googleCalendarId = m.prop(data.googleCalendarId);
  this.name = m.prop(data.name);
  this.free = m.prop(data.free);
}

Room.all = function(callback) {
  googleCalendarAPI.setToken(JSON.parse(localStorage["rooms.access-token"]));
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

var User = function(data) {
  var data = data || {};
  this.authenticated = function() {
    var minutesPassed = new Date(Date.now() - this.createdAt()).getMinutes();
    if (minutesPassed > 59) {
      return false;
    } else {
      return true;
    }
  }
  this.createdAt = m.prop(data.createdAt || Date.now())
}

User.prototype.authenticate = function() {
  var user = new User();
  googleCalendarAPI.checkAuth(function(result) {
    if (result && !result.error) {
      localStorage.clear();
      localStorage["rooms.access-token"] = JSON.stringify(result);
      User.save(user);
      m.mount(document.body, MainApp);
    } else {
      user.createdAt(Date.now() - 61 * 60 * 1000);
      User.save(user);
    }
  });
}

User.save = function(user) {
  localStorage["rooms.current-user"] = JSON.stringify(user);
}

User.load = function() {
  try {
    user = JSON.parse(localStorage["rooms.current-user"]);

    return new User({createdAt: user.createdAt});
  } catch(err) {
    return false;
  }
}

var MainApp = {
  controller: function() {
    var user = User.load() || new User();

    return {user: user}
  },

  view: function(ctrl) {
    return m("div", {class: "app-container"}, [
      ctrl.user.authenticated() ? [m.component(RoomList), m.component(LoadingIcon)] : m.component(Login, {user: ctrl.user})
    ])
  }
}

var Login = {
  view: function(ctrl, data) {
    return m("div", {id: "login"}, [
      m("img", {src: "/app/img/couch.svg"}),
      m("button", {onclick: data.user.authenticate}, "Login with Google")
    ])
  }
}

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

var LoadingIcon = {
  view: function() {
    return m("div", {class: "sk-three-bounce"}, [
      m("div", {class: "sk-child sk-bounce1"}),
      m("div", {class: "sk-child sk-bounce2"}),
      m("div", {class: "sk-child sk-bounce3"})
    ])
  }
}

window.init = function() {
  m.mount(document.body, MainApp);
}
