var Time = module.exports = {
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
