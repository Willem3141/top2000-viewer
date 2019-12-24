top2000-viewer
==============

This is a website to show the currently playing song in the Top 2000. My instance is running at https://top2000.wimiso.nl.

The Top 2000 is an annual event on the Dutch radio station Radio 2 where listeners can vote on the songs they like most; then the 2000 best songs are played. See [this site](http://www.radio2.nl/top2000).

The website uses Node.js. The server-side fetches the currently-playing song from the Radio 2 site and matches it to the Top 2000 song list. It also does some further processing. Then, clients just get this information from the server and display it.

A happy new year in advance :)

Installation and configuration
------------------------------

The installation procedure varies based on how the server is setup but should look something like this:

* Clone this repository: `git clone https://gitlab.com/Willem3141/top2000-viewer.git`
* Install dependencies: `npm install`
* Edit `config.json` to contain the correct port and the server timezone
* Run the application: `node index.js`

