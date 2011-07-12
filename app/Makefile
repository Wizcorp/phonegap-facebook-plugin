all: help

help:
	@echo try one of these commands:
	@echo "  create .... writes out native code to ./tmp directory based on config.xml"
	@echo "  debug ..... copies www, compiles native src, installs and launches"
	@echo "  web ....... serve www at http://localhost:8000"
	@echo "  weinre .... launch weinre at http://localhost:8080"
	@echo "  test ...... compiles ./test into native"
	@echo "  release ... this is for you to implement!"
	@echo "  emulate ... launch platform emulators"
	
create:
	# write out the source for each native platform
	# careful, this is destructive!!!
	./bin/util/validate-config
	#./bin/create/blackberry
	./bin/create/android
	./bin/create/ios

debug: 
	#./bin/debug/blackberry
	./bin/debug/android
	./bin/debug/ios

web:
	cd ./www && python -m SimpleHTTPServer

weinre:
	java -jar ./bin/util/weinre.jar

test:
	@echo "WARNING: Blackberry testing not yet implemented"
	./bin/test/android
	./bin/test/ios

release:
	@echo TODO this would be a good place for shortlog for changelog, minificaiton, key signing, etc

emulate:
	@echo "WARNING: Blackberry must be emulated on Windows"
	./bin/emulate/android
	./bin/emulate/ios

.PHONY: all help create debug web weinre test log release emulate
