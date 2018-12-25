#!/usr/bin/python3

import json

with open('songs-unpruned.json') as f:
    songs = json.load(f)

output = []
for song in songs['data'][0]:
    item = {'title': song['s'],
            'artist': song['a'],
            'year': song['yr'],
            'id': song['pos'],
            'previous': song['prv'],
            'image_id': song['img'],
            'info_url': song['url']}
    output.append(item)

with open('songs.js', 'w') as f:
    json.dump(output, f)
