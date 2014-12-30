top2000-viewer
==============

A small QML program to show the currently playing song in the Top 2000. The Top 2000 is an annual event on the Dutch radio station Radio 2 where listeners can vote on the songs they like most; then the 2000 best songs are played. See [this site](http://www.radio2.nl/top2000).

This program uses [QChart.js](https://github.com/jwintz/qchart.js) for displaying the statistics graph. QChart.js is included as a submodule, so make sure you use `git clone --recursive` when cloning this repository (or [see here](http://stackoverflow.com/questions/4251940/retrospectively-add-recursive-to-a-git-repo)).

Run `qmlscene-qt5 -I qml/ Top2000.qml` (or just `qmlscene -I qml/ Top2000.qml` - this depends on your distribution) to launch the program.

A happy new year in advance :)
