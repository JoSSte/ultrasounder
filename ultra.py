#! /usr/bin/python
import time
import datetime
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BOARD)
GPIO.setwarnings(False)
#log file to write to
outputFile = "output/distances.csv"
timeout = 0.020
#variable to hold last value read
lastread = 0
#maximum allowable error percentage. deviations of less than this are ignored
allowableError = 0.15
maxAllowableError = 100
#read interval in seconds
readInterval = 2
#pin number
pinNumber = 11



#function to calculate deviation between current and previously read value
def deviation(x,y):
	diff = abs(float(x)-float(y))
	#print "Diff: " + str(diff)
	avg = (float(x)+float(y))/2
	#print "AVG: " + str(avg)
	return (diff/avg)

#function to save data
def saveData(value):
	f=open(outputFile,"a")
	f.write(str(value) + ",\"" + str(datetime.datetime.fromtimestamp(time.time()).strftime('%y-%m-%d %H:%M:%S')) + "\"\n")
	f.close()



while 1:
        GPIO.setup(pinNumber, GPIO.OUT)
        #cleanup output
        GPIO.output(pinNumber, 0)

        time.sleep(0.000002)

        #send signal
        GPIO.output(pinNumber, 1)

        time.sleep(readInterval)

        GPIO.output(pinNumber, 0)

        GPIO.setup(pinNumber, GPIO.IN)

        goodread=True
        watchtime=time.time()
        while GPIO.input(pinNumber)==0 and goodread:
                starttime=time.time()
                if (starttime-watchtime > timeout):
                        goodread=False

        if goodread:
                watchtime=time.time()
                while GPIO.input(pinNumber)==1 and goodread:
                        endtime=time.time()
                        if (endtime-watchtime > timeout):
                                goodread=False

        if goodread:
                duration = endtime-starttime
                distance = int(round(duration*34000/2))
                if (distance != lastread):
			#print "D: " + str(distance) + " L: " + str(lastread)
			dev = deviation(lastread,distance)
			#print "DEV: " + str(dev)
			if (dev > allowableError and dev < maxAllowableError):
				#save last entry, only if deviation is big enough.
				lastread = distance
				saveData(distance)
				print str(distance) + "\t\t" + str(datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S'))
