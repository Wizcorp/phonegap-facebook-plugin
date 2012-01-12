function replaceInFile(filename, regexp, replacement) {
    var fso = WScript.CreateObject("Scripting.FileSystemObject");
    var s = fso.OpenTextFile(filename, 1, true).ReadAll();
    s = s.replace(regexp, replacement);
    var f = fso.OpenTextFile(filename, 2, true);
    f.Write(s);
    f.Close();
}

file = File.expand_path(ARGV[0])

replaceInFile(file, /<plugin name="com.phonegap.facebook.Connect" value="com.phonegap.facebook.ConnectPlugin" \/>\n/gm, "");
replaceInFile(file, /\s*<\/plugins>/gm, "\t<plugin name=\"com.phonegap.facebook.Connect\" value=\"com.phonegap.facebook.ConnectPlugin\" />\n</plugins>");