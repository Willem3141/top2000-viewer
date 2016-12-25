#!/usr/bin/python3

import csv

print('[')

with open('TOP-2000-2016.csv', newline='') as csvfile:
	reader = csv.reader(csvfile, delimiter=',', quotechar='"')
	for row in reader:
		print('    {"title":"' + row[1] + '", "artist": "' + row[2] + '", "year": "' + row[3] + '"},')

print(']')
