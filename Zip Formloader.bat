cls
:start
"C:\Program Files\7-Zip\7z.exe" a -tzip "test\mx56\widgets\Formloader.mpk" .\src\*
"C:\Program Files\7-Zip\7z.exe" a -tzip "test\mx515\widgets\Formloader.mpk" .\src\*
TIMEOUT /T 3
goto start

