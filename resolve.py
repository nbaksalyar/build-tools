import hashlib
import urllib2
import os
import sys
import zipfile
import shutil


cache = None;
if ("LIB_CACHE" in os.environ ):
    cache =  os.environ['LIB_CACHE']
    print "Using local jar cache: " + cache

libs= sys.argv[1]

def unzip(source_filename, dest_dir):
    with zipfile.ZipFile(source_filename) as zf:
        for member in zf.infolist():
            # Path traversal defense copied from
            # http://hg.python.org/cpython/file/tip/Lib/http/server.py#l789
            words = member.filename.split('/')
            path = dest_dir
            for word in words[:-1]:
                drive, word = os.path.splitdrive(word)
                head, word = os.path.split(word)
                if word in (os.curdir, os.pardir, ''): continue
                path = os.path.join(path, word)
            zf.extract(member, path)

for i in range(1,len(sys.argv)):
    libs = sys.argv[i]

    print "Downloading dependencies for: " + libs
    cwd = os.path.dirname(libs)

    def download(cwd, file):
        print "downloading " + file
        url = "https://s3.amazonaws.com/papertrail/libs/%s" % file

        try:
            stream = urllib2.urlopen(url)

            with open(os.path.join(cwd,file), 'w') as f:
                while True:
                    chunk = stream.read(16 * 1024)
                    if not chunk: break
                    f.write(chunk)
            if '.zip' in file:
                print "Unzipping %s" % file
                unzip(os.path.join(cwd,file), cwd)
        except Exception, e:
            print "Error " + str(e)


    with open(libs) as f:
        for lib in f:
            if len(lib.strip()) == 0 or '#' in lib:
                continue
            file = lib.split(" ")[0]
            md5 = lib.split(" ")[1].replace('\n', '')
            local = os.path.join(cwd,file)
            if os.path.exists(local):
                current = hashlib.md5(open(local, 'rb').read()).hexdigest()
        
                if md5 != current:
                    download(cwd,file)
                continue
            elif (cache != None):
                cached = os.path.join(cache, file)
                if (os.path.exists(cached)):
                    
                    current = hashlib.md5(open(cached, 'rb').read()).hexdigest()

                    if md5 == current:
                        print "Using cached file: " + cached
                        shutil.copyfile(cached,local )
                        continue

            download(cwd,file)
                    