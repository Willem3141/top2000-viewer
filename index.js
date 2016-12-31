var fs = require('fs');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var schedule = require('node-schedule');

var levenshtein = require('./levenshtein');

var songs = JSON.parse(fs.readFileSync('top2016/songs.js'));
var hours = JSON.parse(fs.readFileSync('top2016/hours.js'));
var config = JSON.parse(fs.readFileSync('config.json'));

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
    if (currentSong.id && currentSong.id != '...' && currentSong.id > 1) {
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
        
        if (d.getMonth() === 11 && (date >= 26 || (date === 25 && hour >= 9))) {
            
            var hourStart = hours[findHour(date, hour)].start_id - 1;
            var hourEnd = hours[findHour(date, hour) + 1].start_id - 1;
            
            var closestMatch = -1;
            var closestLevenshtein = 10000000;
            
            for (var i = Math.min(1999, hourStart + 5); i > Math.max(hourEnd - 5, 0); i--) {
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
    song = {
        'title': songs[id - 1].title,
        'artist': songs[id - 1].artist,
        'id': id,
        'year': songs[id - 1].year
    };
    return song;
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
everyHour.minute = 0;
var j = schedule.scheduleJob(everyHour, showHourOverview);

function showHourOverview() {
    console.log('hour overview');
    
    var d = new Date();
    d.setTime(d.getTime() + config.tz * 60 * 60 * 1000);
    var date = d.getDate();
    var hour = d.getHours();
    
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
