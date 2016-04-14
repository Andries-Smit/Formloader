cls
:start
"C:\Program Files\7-Zip\7z.exe" a -tzip "test\mx56\widgets\FormLoader.mpk" .\src\*
"C:\Program Files\7-Zip\7z.exe" a -tzip "test\mx515\widgets\FormLoader.mpk" .\src\*
"C:\Program Files\7-Zip\7z.exe" a -tzip "test\mx517\widgets\FormLoader.mpk" .\src\*
"C:\Program Files\7-Zip\7z.exe" a -tzip "test\mx521\widgets\FormLoader.mpk" .\src\*
"C:\Program Files\7-Zip\7z.exe" a -tzip "test\mx6.4\widgets\FormLoader.mpk" .\src\*
TIMEOUT /T 3
goto start

