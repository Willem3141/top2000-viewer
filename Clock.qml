import QtQuick 2.1

Item {
    id: root
    width: 262 // acts as minimum width
    height: 262 // acts as minimum height
    
    // public:
    property int hours: 0
    property int minutes: 0
    property int seconds: 0
    
    // private:
    Item {
        id: impl
        width: (parent.width < parent.height) ? parent.width : parent.height
        height: parent.height
        x: (parent.width < parent.height) ? 0 : (parent.width - width) / 2
        y: (parent.width > parent.height) ? 0 : (parent.height - height) / 2
        
        Rectangle {
            id: face
            width: parent.width - 0.025 * parent.width
            height: parent.height - 0.025 * parent.width
            radius: 0.5 * width
            border.width: 0.025 * parent.width
            border.color: "#D8141A"
            
            Item {
                id: shorthand
                anchors.fill: parent
                
                Rectangle {
                    color: "black"
                    x: (parent.width - 0.025 * parent.width) / 2
                    y: 0.2 * parent.width
                    height: 0.3 * parent.width
                    width: 0.025 * parent.width
                    radius: width * 0.5
                }
                
                rotation: (root.hours + root.minutes / 60 + root.seconds / 3600) * 30
                Behavior on rotation {
                    RotationAnimation { direction: RotationAnimation.Clockwise; easing.type: Easing.OutElastic; duration: 500 }
                }
            }
            Item {
                id: longhand
                anchors.fill: parent
                
                Rectangle {
                    color: "black"
                    x: (parent.width - 0.020 * parent.width) / 2
                    y: 0.05 * parent.width
                    height: 0.45 * parent.width
                    width: 0.020 * parent.width
                    radius: width * 0.5
                }
                
                rotation: (root.minutes + root.seconds / 60) * 6
                Behavior on rotation {
                    RotationAnimation { direction: RotationAnimation.Clockwise; easing.type: Easing.OutElastic; duration: 500 }
                }
            }
            Rectangle {
                id: knob
                
                x: parent.width * 0.475
                y: parent.width * 0.475
                width: parent.width * 0.05
                height: parent.width * 0.05
                
                radius: width * 0.5
                
                border.width: width * 0.25
                border.color: "black"
                
                color: "#D8141A"
            }
            Item {
                id: thinhand
                anchors.fill: parent
                
                Rectangle {
                    color: "#D8141A"
                    x: (parent.width - 0.010 * parent.width) / 2
                    y: 0.03 * parent.width
                    height: 0.47 * parent.width
                    width: 0.010 * parent.width
                    radius: width * 0.5
                }
                
                rotation: root.seconds * 6
                Behavior on rotation {
                    RotationAnimation { direction: RotationAnimation.Clockwise; easing.type: Easing.OutElastic; duration: 500 }
                }
            }
        }
    }
}
