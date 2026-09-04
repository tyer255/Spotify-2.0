from PIL import Image
import sys

def print_bars(filename):
    img = Image.open(filename).convert('L')
    width, height = img.size
    
    # scan middle line
    mid_y = height // 2
    pixels = img.load()
    
    # find bars (they are black on white in this url)
    bars = []
    in_bar = False
    start_x = 0
    for x in range(width):
        if pixels[x, mid_y] < 128:
            if not in_bar:
                in_bar = True
                start_x = x
        else:
            if in_bar:
                in_bar = False
                bars.append((start_x, x))
                
    # find height of each bar
    heights = []
    for start, end in bars:
        cx = (start + end) // 2
        # scan up
        y_up = mid_y
        while y_up >= 0 and pixels[cx, y_up] < 128:
            y_up -= 1
        # scan down
        y_down = mid_y
        while y_down < height and pixels[cx, y_down] < 128:
            y_down += 1
        heights.append(y_down - y_up)
        
    # Ignore logo (first big blob)
    # the first few 'bars' might be the logo
    if len(heights) > 23:
        heights = heights[-23:]
        
    # Quantize to 0-7
    if not heights: return
    min_h = min(heights)
    max_h = max(heights)
    range_h = max_h - min_h
    if range_h == 0: range_h = 1
    
    quantized = [int(round((h - min_h) / range_h * 7)) for h in heights]
    print(filename, quantized)
    
    # print ascii graph
    for level in range(7, -1, -1):
        line = ""
        for q in quantized:
            if q >= level:
                line += "█ "
            else:
                line += "  "
        print(line)

try:
    print_bars('rickroll.png')
except Exception as e:
    print(e)
