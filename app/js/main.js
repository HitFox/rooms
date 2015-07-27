var googleCalendarAPI = require('./googleCalendarAPI.js');

var rooms = [];

var Time = {
  timeDifference: function(startTime, endTime) {
    return (endTime - startTime) / 60 / 1000;
  },

  findMatch: function(startTime, endTime, duration) {
    var timeDiff = this.timeDifference(startTime, endTime);
    if (timeDiff >= duration) {
      return true;
    }
    return false;
  },

  calcMinUntil: function(startTime, endTime) {
    return Math.floor(this.timeDifference(startTime, endTime));
  },

  minutesUntilFree: function(duration, times) {
    var finalTimes = [];
    var startTime = new Date(Date.now() - 1 * 60 * 1000);
    var endTime = new Date(Date.now() + 60 * 60 * 1000);
    var self = this;
    if (times.length === 1) {
      if (self.findMatch(new Date(times[0].end), endTime, duration)) {
        finalTimes.push(self.calcMinUntil(startTime, new Date(times[0].end)));
      }
    } else {
      times.forEach(function(time, i) {
        if (i === (times.length - 1)) {
          if (self.findMatch(new Date(time.end), endTime, duration)) {
            finalTimes.push(self.calcMinUntil(startTime, new Date(time.end)));
          }
        } else {
          if (self.findMatch(new Date(time.end), new Date(times[i + 1].start), duration)) {
            finalTimes.push(self.calcMinUntil(startTime, new Date(time.end)));
          }
        }
      });
    }
    if (finalTimes.length === 0) {
      return 60;
    } else {
      return finalTimes[0];
    }
  },

  minutesInWords: function(min) {
    if (min === 1) {
      return " 1 minute"
    } else {
      return " " + min + " minutes"
    }
  }
}

var Room = function(data) {
  var data = data || {};
  this.googleCalendarId = m.prop(data.googleCalendarId);
  this.name = m.prop(data.name);
  this.freeBusyInfo = m.prop(data.freeBusyInfo);
  this.free = function(minutes) {
    var info = this.freeBusyInfo();
    if (info.length === 0) {
      return true;
    } else {
      var firstEvent = info[0];
      minUntilStart = (new Date(firstEvent.start) - new Date(Date.now())) / 60 / 1000;
      if (minUntilStart > minutes) {
        return true;
      } else {
        return false;
      }
    }
  }
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
        var room = new Room({
          googleCalendarId: calendars[name][0],
          name: name,
          freeBusyInfo: calendars[name][1]
        });
        rooms.push(room);
      }
      callback(null, rooms);
    }
  });
}

var User = function(data) {
  var data = data || {};
  this.authenticated = function() {
    var minutesPassed = (Date.now() - this.createdAt()) / 1000 / 60;

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
    var user = User.load() || new User({createdAt: Date.now() - 61 * 60 * 1000});

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
      m("img", {src: "/app/img/couch.svg", id: "couch"}),
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
    return room.free(15) ? 'available' : 'not-available'
  },

  view: function(ctrl, data) {
    var room = data.room;
    return m("li", {class: "room " + this.isRoomAvailableClass(room)}, room.name(),[
      room.free(15) ? "" : m.component(RoomElementInfo, {room: room})
    ])
  }
}

var RoomElementInfo = {
  progressBarWidth: function(room) {
    var min = Time.minutesUntilFree(15, room.freeBusyInfo());
    var minInPercent = (min / 60) * 100;
    return 100 - Math.floor(minInPercent)
  },

  textForWhenRoomIsFree: function(room) {
    var times = room.freeBusyInfo();
    var min = Time.minutesUntilFree(15, times);
    if (min === 60) {
      return "Room not available"
    } else {
      return "Free again in" + Time.minutesInWords(min)
    }
  },

  view: function(ctrl, data) {
    var room = data.room;
    return m("div", {class: "room-info"}, [
      m("div", {class: "progress-bar", style: "width:" + this.progressBarWidth(room) + "%"}),
      m("img", {id: "stopwatch", src: "/app/img/stopwatch.svg"}),
      m("div", {class: "info-text"}, this.textForWhenRoomIsFree(room))
    ])
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
