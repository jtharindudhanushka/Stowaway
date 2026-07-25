from PIL import Image
import os

items_dir = r"c:\Users\jthar\OneDrive\Documents\Pasan\ItemStorageAndRentalPlatform\public\items"
files = ["small_bag.png", "odd_size.png", "carry_on.png", "large_suitcase.png", "tea_chest.png"]

for filename in files:
    path = os.path.join(items_dir, filename)
    if not os.path.exists(path):
        continue
    img = Image.open(path).convert("RGBA")
    datas = img.getdata()
    new_data = []

    for item in datas:
        r, g, b, a = item
        # Neutral gray/white checkerboard pixels check:
        # r, g, b are almost equal (neutral tone) and bright (r > 180, g > 180, b > 180)
        is_checkerboard_neutral = (
            abs(r - g) <= 12 and abs(g - b) <= 12 and abs(r - b) <= 12 and r > 180 and g > 180 and b > 180
        )
        if is_checkerboard_neutral:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append((r, g, b, a))

    img.putdata(new_data)
    img.save(path, "PNG")
    print(f"Cleaned checkerboard background for {filename}")
