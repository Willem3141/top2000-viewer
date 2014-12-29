import QtQuick 2.1
import QtQuick.Layouts 1.1
import QtQuick.Controls 1.2

import "top2014.js" as Top2000

Rectangle {
    
    property real startdatetime;
    property real stopdatetime;
    
    property string previousArtist;
    property string previousTitle;
    
    id: page
    width: 1280
    height: 720
    color: "white"
    
    ColumnLayout {
        spacing: 20
        anchors.left: page.left
        anchors.right: page.right
        anchors.top: page.top
        anchors.bottom: infoBar.top
    
        Rectangle {
            Layout.preferredWidth: parent.width
            Layout.preferredHeight: 120
            //color: "blue"
            
            // volgende liedje
            Text {
                id: previousNumberText
                anchors.top: parent.top
                anchors.left: parent.left
                horizontalAlignment: Text.AlignRight
                width: 400
                color: "#D8141A"
                font.family: "NPO Sans"
                font.pointSize: 56
            }
            
            Text {
                id: previousArtistText
                text: "Laden..."
                anchors.top: parent.top
                anchors.left: previousNumberText.right
                anchors.leftMargin: 40
                font.family: "NPO Sans"
                font.pointSize: 26
            }
            
            Text {
                id: previousTitleText
                text: "Laden..."
                anchors.top: previousArtistText.bottom
                anchors.left: previousNumberText.right
                anchors.leftMargin: 40
                font.pointSize: 34
                font.family: "NPO Sans"
                font.bold: true
            }
        }
        
        Rectangle {
            Layout.preferredWidth: parent.width
            Layout.preferredHeight: 150
            //color: "green"
                
            z: 10
            
            // huidige liedje
            Text {
                id: numberText
                z: 10
                anchors.top: parent.top
                anchors.left: parent.left
                horizontalAlignment: Text.AlignRight
                width: 375
                color: "white"
                font.family: "NPO Sans"
                font.bold: true
                font.pointSize: 90
            }
            
            Text {
                id: artistText
                text: "Laden..."
                anchors.top: parent.top
                anchors.left: numberText.right
                anchors.leftMargin: 65
                font.family: "NPO Sans"
                font.pointSize: 32
            }
            
            Text {
                id: titleText
                text: "Laden..."
                anchors.top: artistText.bottom
                anchors.left: numberText.right
                anchors.leftMargin: 65
                font.pointSize: 42
                font.family: "NPO Sans"
                font.bold: true
            }
            
            Rectangle {
                id: progressBarBackground
                color: "#dddddd"
                anchors.top: titleText.bottom
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.topMargin: 10
                anchors.leftMargin: 440
                anchors.rightMargin: 40
                height: 7
            }
            
            Rectangle {
                id: progressBar
                color: "#D8141A"
                anchors.top: progressBarBackground.top
                anchors.left: parent.left
                anchors.leftMargin: 440
                width: 0.4 * (parent.width - 440 - 40)
                height: 7
            }
            
            Rectangle {
                color: "#D8141A"
                radius: 50
                x: -40
                width: 400
                height: 400
                
                transform: Rotation { origin.x: 200; origin.y: 200; angle: 45 }
                
                anchors.verticalCenter: parent.verticalCenter
            }
        }
    
        Rectangle {
            Layout.preferredWidth: parent.width
            Layout.preferredHeight: 120
            //color: "blue"
            
            // volgende liedje
            Text {
                id: nextNumberText
                anchors.top: parent.top
                anchors.left: parent.left
                horizontalAlignment: Text.AlignRight
                width: 400
                color: "#D8141A"
                font.family: "NPO Sans"
                font.pointSize: 56
            }
            
            Text {
                id: nextArtistText
                text: "Laden..."
                anchors.top: parent.top
                anchors.left: nextNumberText.right
                anchors.leftMargin: 40
                font.family: "NPO Sans"
                font.pointSize: 26
            }
            
            Text {
                id: nextTitleText
                text: "Laden..."
                anchors.top: nextArtistText.bottom
                anchors.left: nextNumberText.right
                anchors.leftMargin: 40
                font.pointSize: 34
                font.family: "NPO Sans"
                font.bold: true
            }
        }
    }
    
    // onderbalk
    Rectangle {
        id: infoBar
        color: "#D8141A"
        anchors.bottom: page.bottom
        anchors.left: page.left
        anchors.right: page.right
        height: 55
    }
    
    Text {
        id: infoBarClock
        color: "white"
        anchors.top: infoBar.top
        anchors.bottom: infoBar.bottom
        anchors.rightMargin: 10
        anchors.right: infoBar.right
        font.pointSize: 31
        font.bold: true
        font.family: "NPO Sans"
        text: "16:07"
    }
    
    Timer {
        interval: 50
        running: true
        repeat: true
        onTriggered: updateProgress()
    }
    
    Timer {
        interval: 2500
        running: true
        repeat: true
        onTriggered: getData()
    }
    
    function updateProgress() {
        var time = new Date().getTime();
        
        var ratio = (time - startdatetime) / (stopdatetime - startdatetime);
        
        if (ratio > 1) {
            ratio = 1;
        }
        
        if (ratio < 0) {
            ratio = 0;
        }
        
        progressBar.width = ratio * (progressBar.parent.width - 440 - 40);
        
        infoBarClock.text = new Date().toLocaleTimeString(Qt.locale("nl_NL"), "HH:mm")
    }
    
    function getData() {
        
        // if the song is still playing, it doesn't make sense to bother the server
        if (new Date().getTime() < stopdatetime) {
            return;
        }
        
        var xmlhttp = new XMLHttpRequest();
        var url = "http://radiobox2.omroep.nl/data/radiobox2/nowonair/2.json";
        
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                updatePlayedSong(xmlhttp.responseText);
            }
        }
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }
    
    function updatePlayedSong(response) {
        var json = JSON.parse(response);
        
        var newArtist = json["results"][0]["songfile"]["artist"]
        var newTitle = json["results"][0]["songfile"]["title"]
        
        if (previousArtist !== newArtist || previousTitle !== newTitle) {
            
            var closestMatch = -1;
            var closestLevenshtein = 10000000;
            
            var beginTime = new Date().getTime();
            for (var i = 0; i < Top2000.top2000.length; i++) {
                if (Top2000.top2000[i].artist[0] !== newArtist[0]
                  || Top2000.top2000[i].title[0] !== newTitle[0]) {
                    continue;
                }
                var levenshtein = levenshteinenator(newArtist, Top2000.top2000[i].artist);
                levenshtein += levenshteinenator(newTitle, Top2000.top2000[i].title);
                if (levenshtein < closestLevenshtein) {
                    closestMatch = i;
                    closestLevenshtein = levenshtein;
                }
                if (levenshtein === 0) {
                    break;
                }
            }
            console.log("Time for Levenshtein algorithm: " + (new Date().getTime() - beginTime) + " ms");
            
            numberText.text = closestMatch + 1;
            artistText.text = Top2000.top2000[closestMatch].artist;
            titleText.text = Top2000.top2000[closestMatch].title;
            
            previousNumberText.text = closestMatch + 2;
            previousArtistText.text = Top2000.top2000[closestMatch + 1].artist;
            previousTitleText.text = Top2000.top2000[closestMatch + 1].title;
            
            nextNumberText.text = closestMatch;
            nextArtistText.text = Top2000.top2000[closestMatch - 1].artist;
            nextTitleText.text = Top2000.top2000[closestMatch - 1].title;
            
            if (!previousArtist) {
                startdatetime = Date.parse(json["results"][0]["startdatetime"]) + 15000;
            } else {
                startdatetime = new Date().getTime();
            }
            stopdatetime = Date.parse(json["results"][0]["stopdatetime"]);
            console.log(artistText.text + " - " + titleText.text + ": " + startdatetime + " - " + stopdatetime);
            
            previousArtist = newArtist;
            previousTitle = newTitle;
        }
    }
    
    /**
     * @param String a
     * @param String b
     * @return Array
     */
    function levenshteinenator(a, b) {
        var cost;
        var m = a.length;
        var n = b.length;

        // make sure a.length >= b.length to use O(min(n,m)) space, whatever that is
        if (m < n) {
            var c = a; a = b; b = c;
            var o = m; m = n; n = o;
        }

        var r = []; r[0] = [];
        for (var c = 0; c < n + 1; ++c) {
            r[0][c] = c;
        }

        for (var i = 1; i < m + 1; ++i) {
            r[i] = []; r[i][0] = i;
            for ( var j = 1; j < n + 1; ++j ) {
                cost = a.charAt( i - 1 ) === b.charAt( j - 1 ) ? 0 : 1;
                r[i][j] = minimator( r[i-1][j] + 1, r[i][j-1] + 1, r[i-1][j-1] + cost );
            }
        }

        return r[m][n];
    }

    /**
     * Return the smallest of the three numbers passed in
     * @param Number x
     * @param Number y
     * @param Number z
     * @return Number
     */
    function minimator(x, y, z) {
        if (x < y && x < z) return x;
        if (y < x && y < z) return y;
        return z;
    }
}
