#! /usr/bin/python
import time
import datetime
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BOARD)
GPIO.setwarnings(False)
timeout = 0.020
lastread = 0
allowableError = 0.05


def deviation(x,y):
	diff = abs(float(x)-float(y))
	#print "Diff: " + str(diff)
	avg = (float(x)+float(y))/2
	#print "AVG: " + str(avg)
	return (diff/avg)

def saveData(value):
	f=open("output/distances.csv","a")
	f.write(str(value) + ",\"" + str(datetime.datetime.fromtimestamp(time.time()).strftime('%y-%m-%d %H:%M:%S')) + "\"\n")
	f.close()



while 1:
        GPIO.setup(11, GPIO.OUT)
        #cleanup output
        GPIO.output(11, 0)

        time.sleep(0.000002)

        #send signal
        GPIO.output(11, 1)

        time.sleep(0.5)

        GPIO.output(11, 0)

        GPIO.setup(11, GPIO.IN)

        goodread=True
        watchtime=time.time()
        while GPIO.input(11)==0 and goodread:
                starttime=time.time()
                if (starttime-watchtime > timeout):
                        goodread=False

        if goodread:
                watchtime=time.time()
                while GPIO.input(11)==1 and goodread:
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
			if (dev > allowableError):
				#save last entry, only if deviation is big enough.
				lastread = distance
				saveData(distance)
				print str(distance) + "," + str(datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S'))
