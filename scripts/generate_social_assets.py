import os
from PIL import Image, ImageDraw, ImageFont

# Configuration
ASSET_DIR = "marketing/spark_100_campaign/assets"
LOGO_PATH = os.path.join(ASSET_DIR, "steam_spark_logo.png")

# Text Mappings (Base Name -> Text)
# Input file will be {base_name}_raw.png
# Output file will be {base_name}.png
ASSETS = {
    "co_creation_hero": "Build Together.\nJoin as a Founding Family.",
    "future_impact_hero": "Engineering Her Future\nwith STEAM Spark.",
    "curiosity_science_hero": "Igniting the Spark\nof Curiosity.",
    "family_pride_hero": "See Their Progress.\nShare Their Pride."
}

def generate_assets():
    if not os.path.exists(LOGO_PATH):
        print(f"Error: Logo not found at {LOGO_PATH}")
        return

    # Load Logo
    logo = Image.open(LOGO_PATH).convert("RGBA")
    
    # Try to load a font
    try:
        # Mac OS Font
        font_path = "/System/Library/Fonts/HelveticaNeue.ttc"
        font = ImageFont.truetype(font_path, 60, index=1) # Bold index usually
    except:
        try:
            font = ImageFont.truetype("Arial", 60)
        except:
            font = ImageFont.load_default()
            print("Warning: collaborative font not found, using default.")

    for base_name, text in ASSETS.items():
        input_filename = f"{base_name}_raw.png"
        output_filename = f"{base_name}.png"
        
        image_path = os.path.join(ASSET_DIR, input_filename)
        output_path = os.path.join(ASSET_DIR, output_filename)
        
        if not os.path.exists(image_path):
            print(f"Skipping missing asset: {input_filename}")
            continue

        print(f"Processing {base_name}...")
        
        # Open Base Reference Image (Raw)
        base_img = Image.open(image_path).convert("RGBA")
        width, height = base_img.size

        # Create Overlay for Text (Gradient-like bottom shade)
        overlay = Image.new("RGBA", base_img.size, (0,0,0,0))
        draw = ImageDraw.Draw(overlay)
        
        # Darken bottom 35% for readability
        gradient_height = int(height * 0.35)
        for y in range(height - gradient_height, height):
            alpha = int(200 * (y - (height - gradient_height)) / gradient_height)
            draw.line([(0, y), (width, y)], fill=(0, 0, 0, alpha))

        # Compose Base + Overlay
        out_img = Image.alpha_composite(base_img, overlay)
        draw_ctx = ImageDraw.Draw(out_img)

        # Draw Text (Bottom Left, with padding)
        text_x = 50
        text_y = height - 180
        
        # Draw Text Shadow for extra readability
        shadow_offset = 2
        draw_ctx.text((text_x + shadow_offset, text_y + shadow_offset), text, font=font, fill=(0, 0, 0, 200))
        draw_ctx.text((text_x, text_y), text, font=font, fill=(255, 255, 255, 255))

        # Draw Logo (Top Right)
        # Resize logo to reasonable size (e.g., 20% of width)
        logo_target_width = int(width * 0.2)
        logo_ratio = logo.height / logo.width
        logo_target_height = int(logo_target_width * logo_ratio)
        
        resized_logo = logo.resize((logo_target_width, logo_target_height), Image.Resampling.LANCZOS)
        
        # Position: Top Right with padding
        logo_x = width - int(logo_target_width) - 40
        logo_y = 40
        out_img.paste(resized_logo, (logo_x, logo_y), resized_logo)

        # Save as main filename
        out_img.save(output_path)
        print(f"Saved {output_filename}")

if __name__ == "__main__":
    generate_assets()
