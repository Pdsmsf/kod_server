# -*- coding: utf-8 -*-
import  xdrlib ,sys
import xlrd
import string
import os

global g_exportDir
global g_fileNamePrefix
global g_currentFileNamePrefix
g_fileNamePrefix = "GameDatas"

def open_excel(file):
    try:
        data = xlrd.open_workbook(file)
        return data
    except Exception,e:
        print str(e)

def nakeName(name):
    details = name.split('_')
    if (len(details) > 1):
        details.pop(0)
        newname = string.join(details, '_')
        return newname
    else:
        return details[0]

def getExportName(fileName):
    details = fileName.split('/')
    details = details[-1].split('.')
    name = details[0]
    return name

def exportLuaFiles(files):
    file = open(g_exportDir + "/" + g_fileNamePrefix + '.lua', "w")
    file.write("%s = {}\n" % (g_fileNamePrefix))
    for fileName in files:
        print("正在导出文件 %s" % (fileName) )
        global g_currentFileNamePrefix
        g_currentFileNamePrefix = getExportName(fileName)
        exportAsLua(fileName, file)
    file.close()

def exportJsFiles(files):
    file = open(g_exportDir + "/" + g_fileNamePrefix + '.js', "w")
    file.write("\"use strict\"\n\n")
    file.write("var %s = {}\n" % (g_fileNamePrefix))
    file.write("module.exports = %s" % (g_fileNamePrefix))
    for fileName in files:
        print("正在导出文件 %s" % (fileName) )
        global g_currentFileNamePrefix
        g_currentFileNamePrefix = getExportName(fileName)
        exportAsJs(fileName, file)
    file.close()    

def exportAsLua(fileName, file):
    global g_currentFileNamePrefix
    data = open_excel(fileName)
    sheetnum = data.nsheets
    list = []
    for tableid in range(sheetnum):
        sheet = data.sheets()[tableid]
        exportSheetAsLua(sheet)
        list.append(sheet.name)

    file.write("\n" + g_fileNamePrefix + "." + g_currentFileNamePrefix + " = {\n");
    for item in list:
        file.write('\t[\"' + item + '\"] = {},\n')
    file.write("}\n")

    #write require info
    for tableid in range(sheetnum):
        sheet = data.sheets()[tableid]
        rowNum = sheet.nrows
        colNum = sheet.ncols
        file.write('require("app.datas.%s_%s")\n' % (g_currentFileNamePrefix, sheet.name))

def exportAsJs(fileName, file):
    global g_currentFileNamePrefix
    data = open_excel(fileName)
    sheetnum = data.nsheets
    prefix = "\n" + g_fileNamePrefix + "." + g_currentFileNamePrefix
    file.write("\n" + prefix + " = {}")
    for tableid in range(sheetnum):
        sheet = data.sheets()[tableid]
        exportSheetAsJs(sheet)
        require = 'require("./%s_%s.js")' % (g_currentFileNamePrefix, sheet.name)
        file.write(prefix + "." + sheet.name + " = " + require)

def exportSheetAsLua(sheet):
    global g_currentFileNamePrefix
    sheetName = sheet.name
    rowNum = sheet.nrows
    colNum = sheet.ncols
    if ((0 == rowNum) or (0 == colNum)):
        return
    sheetName = sheetName
    file = open(g_exportDir + "/" + g_currentFileNamePrefix + "_" + sheetName + '.lua', "w")
    file.write('local %s = %s.%s.%s\n\n' % (sheetName, g_fileNamePrefix, g_currentFileNamePrefix, sheetName))
    #export title
    row = sheet.row_values(0)
    title = []
    for i in range(0, colNum):
        title.append(row[i])

    for i in range(1, rowNum):
        #export one row
        datarow = sheet.row_values(i)

        details = title[0].split('_')
        valueType = details[0]
        keyName = ""
        if ("INT" == valueType):
            keyName = ('%d' % (datarow[0]))
        elif ("STR" == valueType):
            keyName = ('"%s"' % (datarow[0]))
        elif ("MULTISTR" == valueType):
            keyName = ('"%s"' % (datarow[0]))

        luaStr = ('%s[%s] = {\n' % (sheetName, keyName))
        for j in range(0, colNum):
            details = title[j].split('_')
            valueType = details[0]
            if("nil" == datarow[j]):
                text = ('\t["%s"] = %s,\n' % (nakeName(title[j]), "nil") )
            elif ("" == datarow[j]):
                continue
            elif ("INT" == valueType):
                text = ('\t["%s"] = %d,\n' % (nakeName(title[j]), datarow[j]) )
            elif ("FLOAT" == valueType):
                text = ('\t["%s"] = %f,\n' % (nakeName(title[j]), datarow[j]) )
            elif ("BOOL" == valueType):
                text = ('\t["%s"] = %s,\n' % (nakeName(title[j]), datarow[j]) )
            elif ("STR" == valueType):
                text = ('\t["%s"] = "%s",\n' % (nakeName(title[j]), datarow[j]) )
            elif ("MULTISTR" == valueType):
                text = ('\t["%s"] = "%s",\n' % (nakeName(title[j]), datarow[j]) )
            else:
                continue
            luaStr += text
        
        luaStr = luaStr.rsplit(",", 1)[0] + "\n"
        luaStr += '}\n'
        file.write(luaStr.encode('utf-8'))
    file.close()

def exportSheetAsJs(sheet):
    global g_currentFileNamePrefix
    sheetName = sheet.name
    rowNum = sheet.nrows
    colNum = sheet.ncols
    if ((0 == rowNum) or (0 == colNum)):
        return
    
    row = sheet.row_values(0)
    value = row[0]
    valueType = value.split("_")[0]
    if "INT" == valueType:
        valueType = "[]"
    elif "STR" == valueType:
        valueType = "{}"
    elif "MULTISTR" == valueType:
        valueType = "{}"
    else:
        return


    file = open(g_exportDir + "/" + g_currentFileNamePrefix + "_" + sheetName + '.js', "w")
    file.write("\"use strict\"\n\n")
    file.write("var %s = %s\n" % (sheetName, valueType))
    file.write("module.exports = %s\n\n" % (sheetName))
    #export title
    
    title = []
    for i in range(0, colNum):
        title.append(row[i])

    for i in range(1, rowNum):
        #export one row
        datarow = sheet.row_values(i)
        details = title[0].split('_')
        valueType = details[0]
        keyName = ""
        if ("INT" == valueType):
            keyName = '%d' % (datarow[0])
        elif ("STR" == valueType):
            keyName = '"%s"' % (datarow[0])
        elif ("MULTISTR" == valueType):
            keyName = '"%s"' % (datarow[0])
        jsStr = ('%s[%s] = {\n' % (sheetName, keyName))

        for j in range(0, colNum):
            details = title[j].split('_')
            valueType = details[0]
            if("nil" == datarow[j]):
                text = ('\t%s:%s,\n' % (nakeName(title[j]), "null") )
            elif ("" == datarow[j]):
                continue
            elif ("INT" == valueType):
                text = ('\t%s:%d,\n' % (nakeName(title[j]), datarow[j]) )
            elif ("FLOAT" == valueType):
                text = ('\t%s:%f,\n' % (nakeName(title[j]), datarow[j]) )
            elif ("BOOL" == valueType):
                text = ('\t%s:%s,\n' % (nakeName(title[j]), datarow[j]) )
            elif ("STR" == valueType):
                text = ('\t%s:"%s",\n' % (nakeName(title[j]), datarow[j]) )
            elif ("MULTISTR" == valueType):
                text = ('\t%s:(function () {/*%s*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],\n' % (nakeName(title[j]), datarow[j]) )
            else:
                continue    
            jsStr += text
        
        jsStr = jsStr.rsplit(",", 1)[0] + "\n"
        jsStr += '}\n'
        file.write(jsStr.encode('utf-8'))
    file.close()

if __name__=="__main__":
    if len(sys.argv) != 4:
        print("expect 3 params as gamedata dir, export dir and export filetype!")
    else:
        gameDataDir = sys.argv[1]
        g_exportDir = sys.argv[2]
        exportType = sys.argv[3]
        excelFiles = []
        if exportType == "server":
            print("开始导出服务器端配置数据....")
            for root, dirs, files in os.walk(gameDataDir + "/server"):
                for fileName in files:
                    if fileName.endswith((".xlsx", ".xls")) and not "~$" in fileName:
                        excelFiles.append(os.path.join(root, fileName))
            for root, dirs, files in os.walk(gameDataDir + "/shared"):
                for fileName in files:
                    if fileName.endswith((".xlsx", ".xls")) and not "~$" in fileName:
                        excelFiles.append(os.path.join(root, fileName))
            exportJsFiles(excelFiles)
            print("导出服务器端配置数据完成....")
        elif exportType == "client":
            print("开始导出客户端端配置数据....")
            for root, dirs, files in os.walk(gameDataDir + "/client"):
                for fileName in files:
                    if fileName.endswith((".xlsx", ".xls")) and not "~$" in fileName:
                        excelFiles.append(os.path.join(root, fileName))
            for root, dirs, files in os.walk(gameDataDir + "/shared"):
                for fileName in files:
                    if fileName.endswith((".xlsx", ".xls")) and not "~$" in fileName:
                        excelFiles.append(os.path.join(root, fileName))
            exportLuaFiles(excelFiles)
            print("导出客户端端配置数据完成....")