var fs = require('fs');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var schedule = require('node-schedule');

var levenshtein = require('./levenshtein');

var songs = JSON.parse(fs.readFileSync('top2017/songs.js'));
var hours = JSON.parse(fs.readFileSync('top2017/hours.js'));
var votes = JSON.parse(fs.readFileSync('top2017/votes.js'));
var presenters = JSON.parse(fs.readFileSync('top2017/presenters.js'));
var config = JSON.parse(fs.readFileSync('config.json'));

for (var i = 0; i < 1999; i++) {
    songs[i].voters = ['M', 'W'];
}

for (var i = 0; i < votes.length; i++) {
    for (var j = 0; j < votes[i].votes.length; j++) {
        songs[i].voters.push(votes[i].abbreviation);
    }
}

var lastRequestTime = 0;

var currentSong = {
    'title': '...',
    'artist': '...',
    'startTime': 0,
    'stopTime': 0
};
var previousSong = {
    'title': '',
    'artist': '',
    'startTime': 0,
    'stopTime': 0
};
var nextSong = {
    'title': '',
    'artist': '',
    'startTime': 0,
    'stopTime': 0
};

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/layout.css', function(req, res) {
    res.sendFile(__dirname + '/layout.css');
});

io.on('connection', function(socket) {
    console.log('a user connected');
    socket.emit('new song', {currentSong: currentSong, previousSong: previousSong, nextSong: nextSong});
});

http.listen(config.port);

getData();
setInterval(getData, 1000);

function getData() {
    
    // if the song is still playing, we don't need to do anything
    var now = new Date().getTime() + config.tz * 60 * 60 * 1000;
    console.log("current time = " + now +
        ", song ending at = " + currentSong.stopTime);
    if (now < currentSong.stopTime + 3000) {  // three seconds slack
        return;
    }
    
    // okay, song finished... if Top 2000 is in progress, just assume next song has started
    if (currentSong.id && currentSong.id != '...' && currentSong.id > 2) {
        io.emit('new song', {currentSong: songAt(currentSong.id - 1),
            previousSong: songAt(currentSong.id),
            nextSong: songAt(currentSong.id - 2)
        });
    }
    
    // do request
    
    // but don't bother the server too often
    if (now < lastRequestTime + 15000) {
        return;
    }
    lastRequestTime = now;
    
    console.log('sending request for currently playing song');
    var options = {
        "host": "radiobox2.omroep.nl",
        "port": 80,
        "path": "/data/radiobox2/nowonair/2.json"
    }
    require('http').get(options, function(response) {
        response.setEncoding('utf8');

        var data = '';
        response.on('data', function(chunk) {
            data += chunk;
        });

        response.on('end', function() {
            handleResponse(data);
        });
    }).on("error", function(e) {
        console.log("requested current song, but got error: " + e.message);
        io.emit('error', e.message);
    });
}

function handleResponse(data) {
    console.log('got response for currently playing song');
    try {
        var json = JSON.parse(data);
    } catch (e) {
        console.log("Error while parsing JSON: " + e.message);
        console.log("    in JSON string: " + data);
        io.emit('error', 'Returned JSON was invalid: ' + e.message);
        // ...
        return;
    }
    
    var newArtist = json["results"][0]["songfile"]["artist"]
    var newTitle = json["results"][0]["songfile"]["title"]
    
    console.log("current song: " + newArtist + " - " + newTitle);
    
    if (currentSong.artist !== newArtist || currentSong.title !== newTitle) {
        console.log('this is indeed a new song; send update signal');
        
        previousSong = currentSong;
        
        var d = new Date();
        d.setTime(d.getTime() + (1 - config.tz) * 60 * 60 * 1000);
        var date = d.getDate();
        var hour = d.getHours();
        
        if (config.testMode || (d.getMonth() === 11 && (date >= 26 || (date === 25 && hour >= 9)))) {
            
            if (!config.testMode) {
                var hourStart = hours[findHour(date, hour)].start_id - 1;
                var hourEnd = hours[findHour(date, hour) + 1].start_id - 1;
                var searchFrom = Math.min(2000, hourStart + 5);
                var searchTo = Math.max(hourEnd - 5, 1);
            
            } else {
                var searchFrom = 2000;
                var searchTo = 1;
            }
            
            var closestMatch = -1;
            var closestLevenshtein = 10000000;

            for (var i = searchFrom; i >= searchTo; i--) {
                var l = levenshtein.getEditDistance(newArtist, songs[i - 1].artist);
                l += levenshtein.getEditDistance(newTitle, songs[i - 1].title);
                if (l < closestLevenshtein) {
                    closestMatch = i;
                    closestLevenshtein = l;
                }
                if (l === 0) {
                    break;
                }
            }
            
            if (closestLevenshtein > 25) {
                currentSong = {
                    'title': newTitle,
                    'artist': newArtist,
                    'id': '...',
                    'startTime': Date.parse(json["results"][0]["startdatetime"]),
                    'stopTime': Date.parse(json["results"][0]["stopdatetime"])
                };
                nextSong = null;
            } else {
                currentSong = songAt(closestMatch);
                if (closestMatch < 1999) {
                    previousSong = songAt(closestMatch + 1);
                }
                if (closestMatch > 0) {
                    nextSong = songAt(closestMatch - 1);
                }
            }
        } else {
            currentSong = {
                'title': newTitle,
                'artist': newArtist,
            };
            nextSong = null;
        }
        
        currentSong['startTime'] = Date.parse(json["results"][0]["startdatetime"]);
        currentSong['stopTime'] = Date.parse(json["results"][0]["stopdatetime"]);
        io.emit('new song', {currentSong: currentSong,
            previousSong: previousSong,
            nextSong: nextSong});
    }
}

function songAt(id) {
    return songs[id - 1];
}

function findHour(date, hour) {
    for (var i = 0; i < hours.length; i++) {
        if (hours[i].day === date && hours[i].hour === hour) {
            return i;
        }
    }
    
    return -1;
}

var everyHour = new schedule.RecurrenceRule();
var j = schedule.scheduleJob(everyHour, showHourOverview);
j.minute = 0;

if (config.testMode) {
    setInterval(showHourOverview, 5000);
}

function showHourOverview() {
    console.log('showing hour overview');
    
    var d = new Date();
    d.setTime(d.getTime() + config.tz * 60 * 60 * 1000);
    var date = d.getDate();
    var hour = d.getHours();

    if (config.testMode) {
        date = 27;
        hour = 9;
    }
    
    if (d.getMonth() === 11 && (date >= 26 || (date == 25 && hour >= 9))) {
        var songsInHour = [];
        
        var hourStart = hours[findHour(date, hour)].start_id - 1;
        var hourEnd = hours[findHour(date, hour) + 1].start_id - 1;
        
        for (var i = hourStart; i > hourEnd; i--) {
            var song = songs[i];
            song['id'] = i + 1;
            songsInHour.push(song);
        }
        
        io.emit('hour overview', {date: date, hour: hour, hourCount: getHourCount(date, hour), songs: songsInHour});
    }
}

var everyMinute = new schedule.RecurrenceRule();
var j = schedule.scheduleJob(everyHour, function() {
    console.log('time update');
    var d = new Date();
    d.setTime(d.getTime() + config.tz * 60 * 60 * 1000);
    io.emit('time', {hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds()});
});

function getHourCount(date, hour) {
    return 24 * (date - 25) + hour - 8;
}
