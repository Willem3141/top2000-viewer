var fs = require('fs');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var schedule = require('node-schedule');

var levenshtein = require('./levenshtein');

var songs = JSON.parse(fs.readFileSync('top2015/songs.js'));
var hours = JSON.parse(fs.readFileSync('top2015/hours.js'));
var config = JSON.parse(fs.readFileSync('config.json'));

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
setInterval(getData, 15000);

function getData() {
    
    // if the song is still playing, it doesn't make sense to bother the server
    if (new Date().getTime() + config.tz * 60 * 60 * 1000 < currentSong.stopTime) {
        return;
    }
    
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
            
            console.log("Requested current song: " + newArtist + " - " + newTitle);
            
            if (currentSong.artist !== newArtist || currentSong.title !== newTitle) {
                previousSong = currentSong;
                
                var d = new Date();
                d.setTime(d.getTime() + config.tz * 60 * 60 * 1000);
                var date = d.getDate();
                var hour = d.getHours();
                
                if (d.getMonth() === 11 && (date >= 26 || (date === 25 && hour >= 9))) {
                    
                    var hourStart = hours[findHour(date, hour)].start_id - 1;
                    var hourEnd = hours[findHour(date, hour) + 1].start_id - 1;
                    
                    var closestMatch = -1;
                    var closestLevenshtein = 10000000;
                    
                    for (var i = Math.min(2000, hourStart + 5); i > Math.max(hourEnd - 5, 1); i--) {
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
                        currentSong = {
                            'title': songs[closestMatch - 1].title,
                            'artist': songs[closestMatch - 1].artist,
                            'id': closestMatch,
                            'year': songs[closestMatch - 1].year,
                            'previous': songs[closestMatch - 1].previous,
                            'startTime': Date.parse(json["results"][0]["startdatetime"]),
                            'stopTime': Date.parse(json["results"][0]["stopdatetime"])
                        };
                        if (closestMatch < 1999) {
                            previousSong = {
                                'title': songs[closestMatch].title,
                                'artist': songs[closestMatch].artist,
                                'id': closestMatch + 1
                            };
                        }
                        if (closestMatch > 0) {
                            nextSong = {
                                'title': songs[closestMatch - 2].title,
                                'artist': songs[closestMatch - 2].artist,
                                'id': closestMatch - 1
                            };
                        }
                    }
                } else {
                    currentSong = {
                        'title': newTitle,
                        'artist': newArtist,
                        'startTime': Date.parse(json["results"][0]["startdatetime"]),
                        'stopTime': Date.parse(json["results"][0]["stopdatetime"])
                    };
                    nextSong = null;
                }
                io.emit('new song', {currentSong: currentSong, previousSong: previousSong, nextSong: nextSong});
            }
        });
    }).on("error", function(e) {
        console.log("Requested current song, but got error: " + e.message);
        io.emit('error', e.message);
    });
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
            songsInHour.push(songs[i]);
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
