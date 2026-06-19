import os
import sys
from PIL import Image

def main():
    png_path = "public/favicon-256x256.png"
    ico_path = "public/favicon.ico"

    if not os.path.exists(png_path):
        print(f"Error: {png_path} does not exist. Run node scripts/generate_png.js first.")
        sys.exit(1)

    try:
        img = Image.open(png_path)

        # Save as ICO with multiple frame sizes for maximum compatibility:
        # 16x16, 32x32, 48x48, and 256x256
        img.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (256, 256)])
        print(f"Successfully generated {ico_path} with sizes 16x16, 32x32, 48x48, 256x256.")
    except Exception as e:
        print(f"Error generating ICO file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
