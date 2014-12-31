import QtQuick 2.1
import QtQuick.Layouts 1.1
import QtQuick.Controls 1.2

import jbQuick.Charts 1.0

import "top2014.js" as Top2000
import "levenshtein.js" as Levenshtein
import "GraphData.js" as GraphData

Rectangle {
    
    property real startdatetime;
    property real stopdatetime;
    
    property string previousArtist;
    property string previousTitle;
    
    property bool showInfoPanel;
    
    id: page
    width: 1280
    height: 720
    color: "white"
    
    state: "showPlaylist"
    
    states: [
        State {
            name: "showPlaylist"
            PropertyChanges { target: playlist; y: 0; height: parent.height - 55 }
            PropertyChanges { target: infobox; opacity: 0 }
        },
        State {
            name: "showInfo"
            PropertyChanges { target: playlist; y: -1.5 * parent.height + 100; height: parent.height * 3 }
            PropertyChanges { target: infobox; opacity: 1 }
        }
    ]
    transitions: Transition {
        from: "showPlaylist"; to: "showInfo"
        reversible: true
        SequentialAnimation {
            ParallelAnimation {
                NumberAnimation { properties: "y"; duration: 1000; easing.type: Easing.InOutQuad }
                NumberAnimation { properties: "height"; duration: 1000; easing.type: Easing.InOutQuad }
            }
            NumberAnimation { properties: "opacity"; duration: 1000; easing.type: Easing.InOutQuad }
        }
    }
    
    ColumnLayout {
        
        id: playlist
        
        spacing: 20
        x: 0
        y: 0
        width: parent.width
        height: parent.height - 55 // hoogte van de infobar
    
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
                id: currentNumberBlob
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
    
    Item {
        id: infobox
        x: 440
        y: 200
        width: parent.width - 440 - 40
        height: parent.height - 200 - 55 - 40
        
        Text {
            id: currentSongYear
            anchors.left: parent.left
            anchors.top: parent.top
            anchors.right: parent.right;
            font.family: "NPO Sans"
            font.pointSize: 31
            color: "black"
        }
        
        Chart {
            id: positionChart;
            x: 0
            y: currentSongYear.height;
            width: parent.width;
            height: parent.width;
            chartAnimated: true;
            chartAnimationEasing: Easing.OutQuad;
            chartAnimationDuration: 2000;
            chartType: Charts.ChartType.BAR;
            chartOptions: {
                "barShowStroke": false,
                "responsive": true,
                "scaleFontColor": "black",
                "scaleFontFamily": "'NPO Sans', sans-serif",
                "scaleFontSize": 25,
                "scaleGridLineColor": "#ffffff",
                "scaleGridLineWidth": 1.7,
                "scaleOverlay": true,
                "scaleOverride": false,
                "scaleStartValue": 0,
                "scaleSteps": 8,
                "scaleStepWidth": 250
            };
            chartData: GraphData.defaultData
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
    }
    
    Timer {
        id: progressBarUpdateTimer
        interval: 50
        running: true
        repeat: true
        onTriggered: updateProgress()
    }
    
    Timer {
        id: dataUpdateTimer
        interval: 5000
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
        positionChart.width = positionChart.parent.width;
        positionChart.height = positionChart.parent.height;
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
                var levenshtein = Levenshtein.getEditDistance(newArtist, Top2000.top2000[i].artist);
                levenshtein += Levenshtein.getEditDistance(newTitle, Top2000.top2000[i].title);
                if (levenshtein < closestLevenshtein) {
                    closestMatch = i;
                    closestLevenshtein = levenshtein;
                }
                if (levenshtein === 0) {
                    break;
                }
            }
            
            numberText.text = closestMatch + 1;
            artistText.text = Top2000.top2000[closestMatch].artist;
            titleText.text = Top2000.top2000[closestMatch].title;
            
            currentSongYear.text = "(" + Top2000.top2000[closestMatch].year + ")";
            
            var previousData = [];
            for (var j = 0; j < Top2000.top2000[closestMatch].previous.length; j++) {
                previousData.push(parseInt(Top2000.top2000[closestMatch].previous[j], 10));
            }
            positionChart.chartData.datasets = [{
                fillColor: "#D8141A",
                strokeColor: "#D8141A",
                data: previousData
            }]
            console.log(JSON.stringify(positionChart.chartData, null, 4));
            
            if (closestMatch < 1999) {
                previousNumberText.text = closestMatch + 2;
                previousArtistText.text = Top2000.top2000[closestMatch + 1].artist;
                previousTitleText.text = Top2000.top2000[closestMatch + 1].title;
            } else {
                previousNumberText.text = "";
                previousArtistText.text = "";
                previousTitleText.text = "";
            }
            
            if (closestMatch > 0) {
                nextNumberText.text = closestMatch;
                nextArtistText.text = Top2000.top2000[closestMatch - 1].artist;
                nextTitleText.text = Top2000.top2000[closestMatch - 1].title;
            } else {
                nextNumberText.text = "";
                nextArtistText.text = "";
                nextTitleText.text = "";
            }
            
            if (!previousArtist) {
                startdatetime = Date.parse(json["results"][0]["startdatetime"]) + 15000;
                showInfoTimer.start();
                showPlaylistTimer.start();
            } else {
                startdatetime = new Date().getTime() + 1000;
                showInfoTimer.start();
            }
            stopdatetime = Date.parse(json["results"][0]["stopdatetime"]) + 10000;
            console.log(artistText.text + " - " + titleText.text + ": " + startdatetime + " - " + stopdatetime);
            
            previousArtist = newArtist;
            previousTitle = newTitle;
        }
    }
    
    Timer {
        id: showInfoTimer
        interval: 5000
        onTriggered: {
            page.state = "showInfo";
            positionChart.update();
            positionChart.repaint();
            showPlaylistTimer.start();
        }
    }
    
    Timer {
        id: showPlaylistTimer
        interval: 15000
        onTriggered: {
            page.state = "showPlaylist";
        }
    }
}
