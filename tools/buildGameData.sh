#!/bin/bash

ServerDir=../game-server/app/datas
GameDataDir=../gameData

python ./buildGameData/buildGameData.py $GameDataDir $ServerDir "server"