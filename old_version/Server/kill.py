#!/usr/bin/python
#encoding=utf-8

import os, sys


path = sys.argv[0]
dirname = os.path.dirname(path)
execute_file = None
file_list = os.listdir(dirname)
for file_name in file_list:
	if file_name.endswith(".exe"):
		execute_file = file_name
		print execute_file
		break

if os.path.exists("config"):
	for parent,dirnames,filenames in os.walk("config"):
		for filename in filenames:
			win_title = os.path.basename(dirname) + filename[len("gameconfig"):]
			os.system("taskkill /im " + execute_file + " /fi \"windowtitle eq " + win_title + "\"")
