from machine import Pin, I2C
import ssd1306
import time

# Constants
CHAR_PER_ROW = 16
ROW_HEIGHT = 10
MAX_LINES = 7
MAX_EMPTY_LINES = 2

class Display():
    def __init__(self, scl:int, sda:int, id = 0):
        # Set up I2C
        i2c = I2C(id, scl=Pin(scl), sda=Pin(sda), freq=400000)

        # Create display object (128x64)
        oled_width = 128
        oled_height = 64
        self.oled = ssd1306.SSD1306_I2C(oled_width, oled_height, i2c)

        self.linesOfText = []
        self.startingLine = 0

    def parseMessage(self, text:str) -> None:
        #New Message so go back to top
        self.startingLine = 0

        #split message into words
        words = text.split(" ")

        self.linesOfText = []
        line = ""
        while len(words) > 0:
            # if new line add word even if it exceeds limit
            if len(line) == 0:
                if len(words[0]) > CHAR_PER_ROW:
                    line += words[0][:CHAR_PER_ROW-1] + '-'
                    words[0] = words[0][CHAR_PER_ROW-1:]
                else:
                    line += words.pop(0)

            #else add word if it doesn't exceed char limit
            elif (len(line) + 1 + len(words[0])) <= CHAR_PER_ROW:
                line += ' ' + words.pop(0)

            #If cannot add to current line, start new line
            else:
                self.linesOfText.append(line)
                line = ""
        
        #Edge case: add final line of text
        if len(line) > 0:
            self.linesOfText.append(line)

    def displayText(self, offset=0) -> None:
        # Clear display
        self.oled.fill(0)

        #Limit Start Row
        startRow = self.startingLine
        startRow = min(len(self.linesOfText)-MAX_LINES+MAX_EMPTY_LINES, startRow)
        startRow = max(0,startRow)

        # Print Lines
        for i in range(MAX_LINES):
            if (i+startRow) >= len(self.linesOfText):
                break
            self.oled.text(self.linesOfText[i+startRow], 0, i*ROW_HEIGHT + offset)

        # Show on OLED
        self.oled.show()

    def shiftStartLine(self, shift:int) -> None:
        #Shift starting line
        self.startingLine += shift

        #Keep Starting line in bounds
        self.startingLine = min(len(self.linesOfText)-MAX_LINES+MAX_EMPTY_LINES, self.startingLine)
        self.startingLine = max(0,self.startingLine)

    def PrintMessage(self, text:str) -> None:
        self.parseMessage(text)
        self.displayText()

    def ScrollUp(self) -> None:
        self.shiftStartLine(-1)
        self.displayText()

    def ScrollDown(self) -> None:
        self.shiftStartLine(1)
        self.displayText()

